export type Role = 'admin' | 'faculty' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface QRSession {
  id: string;
  faculty_id: string;
  course_id: string;
  start_time: string;
  expiry_time: string;
  status: 'active' | 'expired' | 'confirmed';
}

export interface Attendance {
  id: string;
  student_id: string;
  session_id: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  timestamp: string;
  details: string;
}
