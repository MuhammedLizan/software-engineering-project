import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Attendance, QRSession, UserProfile } from '../types/database';
import { ArrowLeft, CheckCircle, XCircle, Clock, Users, Download } from 'lucide-react';

export default function AttendanceReport() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<QRSession | null>(null);
  const [attendance, setAttendance] = useState<(Attendance & { profiles: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const [sessionRes, attendanceRes] = await Promise.all([
        supabase.from('qr_sessions').select('*').eq('id', sessionId).single(),
        supabase.from('attendance').select('*, profiles(*)').eq('session_id', sessionId),
      ]);

      if (sessionRes.data) setSession(sessionRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data as any);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAttendance = async () => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('qr_sessions')
        .update({ status: 'confirmed' })
        .eq('id', session.id);

      if (error) throw error;
      setSession({ ...session, status: 'confirmed' });
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!session) return <div className="p-8 text-center">Session not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/faculty')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-gray-500">Course: {session.course_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Students</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{attendance.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Session Status</h3>
          </div>
          <p className="text-xl font-bold text-gray-900 capitalize">{session.status}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Date</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {new Date(session.start_time).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Attendance List</h2>
          <div className="flex gap-3">
            {session.status === 'active' && (
              <button
                onClick={confirmAttendance}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm List
              </button>
            )}
            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Time Marked</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{record.profiles?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{record.profiles?.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No attendance records yet for this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
