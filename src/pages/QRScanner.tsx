import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QrCode, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function QRScanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Initialize scanner only when idle and scanning is true
    if (scanning && status === 'idle') {
      const startScanner = async () => {
        try {
          // Small delay to ensure the DOM element is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              console.log('Scanned QR Data:', decodedText);
              // Stop scanner immediately on success
              if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
              }
              processAttendance(decodedText);
            },
            (errorMessage) => {
              // Ignore frequent scan errors (e.g. no QR in frame)
            }
          );
        } catch (err) {
          handleError(err);
        }
      };

      startScanner();
    }

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error('Cleanup error:', err));
      }
    };
  }, [scanning, status]);

  const processAttendance = async (sessionId: string) => {
    if (!sessionId || sessionId === 'undefined') {
      setStatus('error');
      setMessage('Invalid QR code data.');
      return;
    }
    setScanning(false);
    setStatus('loading');

    try {
      // 1. Verify session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid QR code or session not found.');
      }

      if (session.status !== 'active') {
        throw new Error('This session has already expired or been confirmed.');
      }

      if (new Date(session.expiry_time) < new Date()) {
        throw new Error('This QR code has expired.');
      }

      // 2. Record attendance
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([
          {
            student_id: user?.id,
            session_id: sessionId,
            status: 'present',
          },
        ]);

      if (attendanceError) {
        if (attendanceError.code === '23505') {
          throw new Error('You have already marked attendance for this session.');
        }
        throw attendanceError;
      }

      // 3. Get total attendance count for summary
      const { count, error: countError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (countError) console.error('Error fetching count:', countError);

      // 4. Log the action
      await supabase.from('audit_logs').insert([
        {
          user_id: user?.id,
          action: 'MARK_ATTENDANCE',
          details: `Marked attendance for session ${sessionId}`,
        },
      ]);

      setStatus('success');
      setMessage(`Attendance marked for ${session.course_id}, ${count || 0} students present`);
      setTimeout(() => navigate('/student'), 3500);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  const handleError = (err: any) => {
    console.error('Camera Error:', err);
    setStatus('error');
    
    let errorMsg = 'Camera access denied or error occurred.';
    if (err?.name === 'NotAllowedError') {
      errorMsg = 'Camera permission was denied. Please enable it in your browser settings.';
    } else if (err?.name === 'NotFoundError') {
      errorMsg = 'No camera found on this device.';
    } else if (window.location.protocol !== 'https:') {
      errorMsg = 'Camera access requires a secure (HTTPS) connection.';
    }
    
    setMessage(errorMsg);
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-gray-500">Point your camera at the faculty's QR code</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative aspect-square">
        {scanning && status === 'idle' && (
          <div id="reader" className="w-full h-full"></div>
        )}

        {status !== 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-900 font-medium">Processing attendance...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-green-900 font-bold text-lg">{message}</p>
                <p className="text-gray-500 mt-2 text-sm">Redirecting to dashboard...</p>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-red-900 font-bold text-lg">{message}</p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setScanning(true);
                  }}
                  className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}

        {/* Scanner Overlay */}
        {scanning && status === 'idle' && (
          <div className="absolute inset-0 border-2 border-indigo-500/30 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-600"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-600"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-600"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-600"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-600/50 animate-pulse"></div>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex gap-3">
          <QrCode className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <p className="text-xs text-indigo-700 leading-relaxed">
            Ensure you are in a well-lit environment and the QR code is clearly visible in the frame.
          </p>
        </div>
        <div className="pt-2 border-t border-indigo-100">
          <p className="text-[10px] text-indigo-500 italic">
            Tip: If the camera doesn't load, ensure you've granted camera permissions in your browser settings and are using a secure (HTTPS) connection.
          </p>
        </div>
      </div>
    </div>
  );
}
