import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QrCode, Clock, AlertCircle, CheckCircle, Copy } from 'lucide-react';

export default function QRGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(3);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (session?.id) {
      // Subscribe to real-time attendance updates
      const subscription = supabase
        .channel(`attendance:${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance',
            filter: `session_id=eq.${session.id}`,
          },
          () => {
            setAttendanceCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [session?.id]);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startTime = new Date();
      const expiryTime = new Date(startTime.getTime() + expiryMinutes * 60000);

      const { data, error } = await supabase
        .from('qr_sessions')
        .insert([
          {
            faculty_id: user?.id,
            course_id: courseId,
            start_time: startTime.toISOString(),
            expiry_time: expiryTime.toISOString(),
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setSession(data);
      setAttendanceCount(0);
      
      // Log session creation
      await supabase.from('audit_logs').insert([
        {
          user_id: user?.id,
          action: 'CREATE_SESSION',
          details: `Created session for ${courseId}`,
        },
      ]);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Expire old session first
      await supabase
        .from('qr_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id);

      const startTime = new Date();
      const expiryTime = new Date(startTime.getTime() + expiryMinutes * 60000);

      const { data, error } = await supabase
        .from('qr_sessions')
        .insert([
          {
            faculty_id: user?.id,
            course_id: courseId,
            start_time: startTime.toISOString(),
            expiry_time: expiryTime.toISOString(),
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setSession(data);
      setAttendanceCount(0);

      await supabase.from('audit_logs').insert([
        {
          user_id: user?.id,
          action: 'REFRESH_SESSION',
          details: `Refreshed session for ${courseId}`,
        },
      ]);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmSession = async () => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('qr_sessions')
        .update({ status: 'confirmed' })
        .eq('id', session.id);

      if (error) throw error;
      navigate('/faculty');
    } catch (error) {
      console.error('Error confirming session:', error);
    }
  };

  if (session) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-inner inline-block">
              <QRCodeSVG 
                value={session.id} 
                size={256}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{session.course_id}</h2>
            <p className="text-gray-500 mt-1">Scan this QR code to mark attendance</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                ID: {session.id}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.id);
                  alert('Session ID copied to clipboard!');
                }}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Copy Session ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Students</p>
              <p className="text-3xl font-bold text-indigo-600">{attendanceCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Expires In</p>
              <p className="text-3xl font-bold text-gray-900">{expiryMinutes}m</p>
            </div>
          </div>
          <div className="pt-6 flex flex-col gap-3">
            <div className="flex gap-4">
              <button
                onClick={() => setSession(null)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={refreshSession}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" />
                Refresh QR
              </button>
            </div>
            <button
              onClick={confirmSession}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Attendance
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center gap-3 text-indigo-600">
          <QrCode className="w-8 h-8" />
          <h2 className="text-xl font-bold">Generate QR Session</h2>
        </div>

        <form onSubmit={createSession} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course ID / Name</label>
            <input
              type="text"
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. CS101 - Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Time (Minutes)</label>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setExpiryMinutes(m)}
                  className={`py-2 border rounded-lg text-sm font-medium transition-all ${
                    expiryMinutes === m
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              The QR code will automatically expire after {expiryMinutes} minutes. Students must scan it within this timeframe.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
