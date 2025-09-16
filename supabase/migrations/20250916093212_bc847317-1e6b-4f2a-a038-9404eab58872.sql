-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  department TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  head_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 0,
  room_type TEXT NOT NULL DEFAULT 'classroom' CHECK (room_type IN ('classroom', 'lab', 'seminar', 'auditorium')),
  department_id UUID REFERENCES public.departments(id),
  facilities TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faculty table
CREATE TABLE public.faculty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  designation TEXT,
  specialization TEXT[],
  max_hours_per_week INTEGER DEFAULT 40,
  preferred_time_slots JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 3,
  course_type TEXT NOT NULL DEFAULT 'theory' CHECK (course_type IN ('theory', 'practical', 'lab', 'project')),
  department_id UUID REFERENCES public.departments(id),
  semester INTEGER,
  duration_minutes INTEGER DEFAULT 60,
  prerequisites TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  section TEXT,
  department_id UUID REFERENCES public.departments(id),
  student_count INTEGER DEFAULT 0,
  class_representative_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_assignments table (faculty assigned to courses for specific batches)
CREATE TABLE public.course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  hours_per_week INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, batch_id, academic_year, semester)
);

-- Create timetable_runs table
CREATE TABLE public.timetable_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'published', 'failed')),
  generated_by UUID REFERENCES public.profiles(id),
  generation_config JSONB,
  generation_log TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.timetable_runs(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  course_assignment_id UUID NOT NULL REFERENCES public.course_assignments(id),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(batch_id, day_of_week, start_time, run_id),
  UNIQUE(room_id, day_of_week, start_time, run_id),
  UNIQUE(course_assignment_id, day_of_week, start_time, run_id)
);

-- Create leaves table for faculty leave management
CREATE TABLE public.leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'vacation', 'emergency', 'conference')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id),
  substitute_faculty_id UUID REFERENCES public.faculty(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'timetable_update')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create constraints table for timetable generation rules
CREATE TABLE public.constraints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hard', 'soft')),
  description TEXT,
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin-only policies for management tables
CREATE POLICY "Admins can manage departments" ON public.departments
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view departments" ON public.departments
FOR SELECT USING (true);

CREATE POLICY "Admins can manage rooms" ON public.rooms
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view rooms" ON public.rooms
FOR SELECT USING (true);

CREATE POLICY "Admins can manage faculty" ON public.faculty
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view faculty" ON public.faculty
FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view courses" ON public.courses
FOR SELECT USING (true);

CREATE POLICY "Admins can manage batches" ON public.batches
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view batches" ON public.batches
FOR SELECT USING (true);

CREATE POLICY "Admins can manage course assignments" ON public.course_assignments
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view course assignments" ON public.course_assignments
FOR SELECT USING (true);

CREATE POLICY "Admins can manage timetable runs" ON public.timetable_runs
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view published timetable runs" ON public.timetable_runs
FOR SELECT USING (status = 'published' OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view published timetables" ON public.timetables
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.timetable_runs tr 
    WHERE tr.id = run_id AND tr.status = 'published'
  ) OR public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins can manage timetables" ON public.timetables
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Leave policies
CREATE POLICY "Faculty can manage their own leaves" ON public.leaves
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.faculty f 
    WHERE f.id = faculty_id AND f.profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can manage all leaves" ON public.leaves
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage constraints" ON public.constraints
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view constraints" ON public.constraints
FOR SELECT USING (true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON public.leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER TABLE public.timetables REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.leaves REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaves;