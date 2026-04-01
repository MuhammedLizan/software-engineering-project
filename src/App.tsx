import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import QRGenerator from './pages/QRGenerator';
import QRScanner from './pages/QRScanner';
import AttendanceReport from './pages/AttendanceReport';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/users" element={<AdminDashboard />} />
                    <Route path="/logs" element={<AdminDashboard />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty/*"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<FacultyDashboard />} />
                    <Route path="/qr-generator" element={<QRGenerator />} />
                    <Route path="/attendance/:sessionId" element={<AttendanceReport />} />
                    <Route path="/reports" element={<FacultyDashboard />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<StudentDashboard />} />
                    <Route path="/qr-scanner" element={<QRScanner />} />
                    <Route path="/attendance" element={<StudentDashboard />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
