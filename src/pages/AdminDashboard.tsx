import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog } from '../types/database';
import { UserPlus, Trash2, Shield, Search, Users, Activity, X, Mail, Lock, User as UserIcon, GraduationCap, Briefcase } from 'lucide-react';
import { Role } from '../types/database';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('student');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(10),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setUsers(users.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError(null);

    try {
      // Note: In a production app, creating users as an admin should be done via 
      // Supabase Auth Admin API (Service Role Key) on a server/edge function 
      // to avoid signing out the current admin.
      // For this demo, we use the standard signUp.
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
          },
        ]);

        if (profileError) throw profileError;

        // Log the action
        await supabase.from('audit_logs').insert([
          {
            user_id: data.user.id,
            action: 'USER_CREATED',
            details: `Admin created ${newUserRole}: ${newUserEmail}`,
          },
        ]);

        alert(`User ${newUserEmail} created successfully! Note: You might need to sign in again as admin if the session was updated.`);
        setIsModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchData();
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage users and monitor system activity</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Logs</p>
              <p className="text-xl font-bold text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'student', name: 'Student', icon: GraduationCap },
                    { id: 'faculty', name: 'Faculty', icon: Briefcase },
                  ].map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setNewUserRole(r.id as Role)}
                        className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                          newUserRole === r.id
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-semibold">{r.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                  {creating ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'faculty'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      log.action === 'SECURITY_ALERT' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <Shield className={`w-4 h-4 ${
                        log.action === 'SECURITY_ALERT' ? 'text-red-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${
                      log.action === 'SECURITY_ALERT' ? 'text-red-600' : 'text-gray-900'
                    }`}>{log.action}</p>
                    <p className={`text-xs truncate ${
                      log.action === 'SECURITY_ALERT' ? 'text-red-500' : 'text-gray-500'
                    }`}>{log.details}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
