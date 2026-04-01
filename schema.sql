-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create QR sessions table
CREATE TABLE IF NOT EXISTS qr_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'confirmed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES qr_sessions(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  UNIQUE(student_id, session_id)
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)

-- Profiles: Users can read all profiles, but only update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- QR Sessions: Faculty can manage their own, everyone can read
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are viewable by everyone" ON qr_sessions FOR SELECT USING (true);
CREATE POLICY "Faculty can insert own sessions" ON qr_sessions FOR INSERT WITH CHECK (auth.uid() = faculty_id);
CREATE POLICY "Faculty can update own sessions" ON qr_sessions FOR UPDATE USING (auth.uid() = faculty_id);

-- Attendance: Students can manage their own, faculty can read all
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance is viewable by everyone" ON attendance FOR SELECT USING (true);
CREATE POLICY "Students can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Audit Logs: Admins can read all, everyone can insert
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Everyone can insert logs" ON audit_logs FOR INSERT WITH CHECK (true);
