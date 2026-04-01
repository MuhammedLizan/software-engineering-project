import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRSession, Attendance } from '../types/database';
import { Plus, Clock, Users, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('faculty_id', user?.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-500">Manage your attendance sessions and reports</p>
        </div>
        <Link
          to="/faculty/qr-generator"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Session
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Active Sessions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {sessions.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Sessions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Attendance</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/faculty/attendance/${session.id}`}
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${getStatusColor(session.status)} border`}>
                  {session.status === 'active' ? (
                    <Clock className="w-5 h-5" />
                  ) : session.status === 'confirmed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Course: {session.course_id}</h4>
                  <p className="text-sm text-gray-500">
                    Started: {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
          {sessions.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500">No sessions found. Create your first session to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
