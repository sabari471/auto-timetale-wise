-- Comprehensive data seeding for timetable generation
-- This migration ensures all necessary data is available for generating timetables

-- Insert departments
INSERT INTO public.departments (id, name, code) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Computer Science and Engineering', 'CSE'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Electronics and Communication Engineering', 'ECE'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mechanical Engineering', 'ME'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Civil Engineering', 'CE')
ON CONFLICT (id) DO NOTHING;

-- Insert admin profile
INSERT INTO public.profiles (id, user_id, email, full_name, role, department, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '00000000-0000-0000-0000-000000000000', 'admin@timetable.com', 'System Administrator', 'admin', 'CSE', '+1234567890')
ON CONFLICT (id) DO NOTHING;

-- Insert faculty profiles
INSERT INTO public.profiles (id, user_id, email, full_name, role, department, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '11111111-1111-1111-1111-111111111111', 'dr.smith@university.edu', 'Dr. John Smith', 'faculty', 'CSE', '+1234567891'),
  ('550e8400-e29b-41d4-a716-446655440012', '22222222-2222-2222-2222-222222222222', 'prof.jones@university.edu', 'Prof. Sarah Jones', 'faculty', 'CSE', '+1234567892'),
  ('550e8400-e29b-41d4-a716-446655440013', '33333333-3333-3333-3333-333333333333', 'dr.brown@university.edu', 'Dr. Michael Brown', 'faculty', 'ECE', '+1234567893'),
  ('550e8400-e29b-41d4-a716-446655440014', '44444444-4444-4444-4444-444444444444', 'prof.wilson@university.edu', 'Prof. Emily Wilson', 'faculty', 'ECE', '+1234567894'),
  ('550e8400-e29b-41d4-a716-446655440015', '55555555-5555-5555-5555-555555555555', 'dr.davis@university.edu', 'Dr. Robert Davis', 'faculty', 'ME', '+1234567895')
ON CONFLICT (id) DO NOTHING;

-- Insert faculty records
INSERT INTO public.faculty (id, profile_id, employee_id, department_id, designation, specialization, max_hours_per_week, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'FAC001', '550e8400-e29b-41d4-a716-446655440001', 'Professor', ARRAY['Data Structures', 'Algorithms', 'Machine Learning'], 20, true),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'FAC002', '550e8400-e29b-41d4-a716-446655440001', 'Associate Professor', ARRAY['Database Systems', 'Software Engineering'], 18, true),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 'FAC003', '550e8400-e29b-41d4-a716-446655440002', 'Professor', ARRAY['Digital Electronics', 'Microprocessors'], 20, true),
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'FAC004', '550e8400-e29b-41d4-a716-446655440002', 'Assistant Professor', ARRAY['Communication Systems', 'Signal Processing'], 18, true),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440015', 'FAC005', '550e8400-e29b-41d4-a716-446655440003', 'Professor', ARRAY['Thermodynamics', 'Fluid Mechanics'], 20, true)
ON CONFLICT (id) DO NOTHING;

-- Insert rooms
INSERT INTO public.rooms (id, name, code, capacity, room_type, department_id, facilities, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', 'Main Lecture Hall 1', 'LH-101', 100, 'classroom', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Projector', 'Whiteboard', 'Air Conditioning'], true),
  ('550e8400-e29b-41d4-a716-446655440032', 'Main Lecture Hall 2', 'LH-102', 80, 'classroom', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Projector', 'Whiteboard'], true),
  ('550e8400-e29b-41d4-a716-446655440033', 'Computer Lab 1', 'LAB-C1', 40, 'lab', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Computers', 'Projector', 'Network'], true),
  ('550e8400-e29b-41d4-a716-446655440034', 'Computer Lab 2', 'LAB-C2', 40, 'lab', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Computers', 'Projector', 'Network'], true),
  ('550e8400-e29b-41d4-a716-446655440035', 'Electronics Lab', 'LAB-E1', 30, 'lab', '550e8400-e29b-41d4-a716-446655440002', ARRAY['Oscilloscopes', 'Multimeters', 'Breadboards'], true),
  ('550e8400-e29b-41d4-a716-446655440036', 'Seminar Hall', 'SH-201', 50, 'seminar', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Projector', 'Microphone', 'Air Conditioning'], true),
  ('550e8400-e29b-41d4-a716-446655440037', 'Auditorium', 'AUD-301', 200, 'auditorium', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Stage', 'Sound System', 'Projector'], true),
  ('550e8400-e29b-41d4-a716-446655440038', 'Tutorial Room 1', 'TR-101', 25, 'classroom', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Whiteboard', 'Chairs'], true),
  ('550e8400-e29b-41d4-a716-446655440039', 'Tutorial Room 2', 'TR-102', 25, 'classroom', '550e8400-e29b-41d4-a716-446655440001', ARRAY['Whiteboard', 'Chairs'], true),
  ('550e8400-e29b-41d4-a716-446655440040', 'Mechanical Workshop', 'WS-M1', 20, 'lab', '550e8400-e29b-41d4-a716-446655440003', ARRAY['Tools', 'Machines', 'Safety Equipment'], true)
ON CONFLICT (id) DO NOTHING;

-- Insert batches
INSERT INTO public.batches (id, name, year, semester, section, department_id, student_count, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440041', 'CS-A 2024', 2024, 1, 'A', '550e8400-e29b-41d4-a716-446655440001', 45, true),
  ('550e8400-e29b-41d4-a716-446655440042', 'CS-B 2024', 2024, 1, 'B', '550e8400-e29b-41d4-a716-446655440001', 42, true),
  ('550e8400-e29b-41d4-a716-446655440043', 'CS-A 2023', 2023, 3, 'A', '550e8400-e29b-41d4-a716-446655440001', 48, true),
  ('550e8400-e29b-41d4-a716-446655440044', 'ECE-A 2024', 2024, 1, 'A', '550e8400-e29b-41d4-a716-446655440002', 40, true),
  ('550e8400-e29b-41d4-a716-446655440045', 'ECE-B 2024', 2024, 1, 'B', '550e8400-e29b-41d4-a716-446655440002', 38, true),
  ('550e8400-e29b-41d4-a716-446655440046', 'ME-A 2024', 2024, 1, 'A', '550e8400-e29b-41d4-a716-446655440003', 35, true)
ON CONFLICT (id) DO NOTHING;

-- Insert courses
INSERT INTO public.courses (id, name, code, credits, course_type, department_id, duration_minutes, prerequisites, is_active) VALUES
  -- CSE Courses
  ('550e8400-e29b-41d4-a716-446655440051', 'Data Structures and Algorithms', 'CSE101', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY[]::TEXT[], true),
  ('550e8400-e29b-41d4-a716-446655440052', 'Data Structures Lab', 'CSE101L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440001', 120, ARRAY['CSE101'], true),
  ('550e8400-e29b-41d4-a716-446655440053', 'Database Management Systems', 'CSE102', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE101'], true),
  ('550e8400-e29b-41d4-a716-446655440054', 'Database Lab', 'CSE102L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440001', 120, ARRAY['CSE102'], true),
  ('550e8400-e29b-41d4-a716-446655440055', 'Software Engineering', 'CSE103', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE102'], true),
  ('550e8400-e29b-41d4-a716-446655440056', 'Computer Networks', 'CSE201', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE101'], true),
  ('550e8400-e29b-41d4-a716-446655440057', 'Operating Systems', 'CSE202', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE101'], true),
  ('550e8400-e29b-41d4-a716-446655440058', 'Machine Learning', 'CSE301', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE101', 'CSE102'], true),
  
  -- ECE Courses
  ('550e8400-e29b-41d4-a716-446655440061', 'Digital Electronics', 'ECE101', 3, 'theory', '550e8400-e29b-41d4-a716-446655440002', 60, ARRAY[]::TEXT[], true),
  ('550e8400-e29b-41d4-a716-446655440062', 'Digital Electronics Lab', 'ECE101L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440002', 120, ARRAY['ECE101'], true),
  ('550e8400-e29b-41d4-a716-446655440063', 'Communication Systems', 'ECE102', 3, 'theory', '550e8400-e29b-41d4-a716-446655440002', 60, ARRAY['ECE101'], true),
  ('550e8400-e29b-41d4-a716-446655440064', 'Microprocessors', 'ECE201', 3, 'theory', '550e8400-e29b-41d4-a716-446655440002', 60, ARRAY['ECE101'], true),
  
  -- ME Courses
  ('550e8400-e29b-41d4-a716-446655440071', 'Thermodynamics', 'ME101', 3, 'theory', '550e8400-e29b-41d4-a716-446655440003', 60, ARRAY[]::TEXT[], true),
  ('550e8400-e29b-41d4-a716-446655440072', 'Fluid Mechanics', 'ME102', 3, 'theory', '550e8400-e29b-41d4-a716-446655440003', 60, ARRAY['ME101'], true),
  ('550e8400-e29b-41d4-a716-446655440073', 'Mechanical Workshop', 'ME101L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440003', 120, ARRAY['ME101'], true)
ON CONFLICT (id) DO NOTHING;

-- Insert course assignments
INSERT INTO public.course_assignments (id, course_id, faculty_id, batch_id, academic_year, semester, hours_per_week) VALUES
  -- CSE Assignments
  ('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440041', '2024-25', 1, 3),
  ('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440041', '2024-25', 1, 2),
  ('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440041', '2024-25', 1, 3),
  ('550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440041', '2024-25', 1, 2),
  ('550e8400-e29b-41d4-a716-446655440085', '550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440041', '2024-25', 1, 3),
  
  -- CS-B 2024 assignments
  ('550e8400-e29b-41d4-a716-446655440086', '550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440042', '2024-25', 1, 3),
  ('550e8400-e29b-41d4-a716-446655440087', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440042', '2024-25', 1, 2),
  ('550e8400-e29b-41d4-a716-446655440088', '550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440042', '2024-25', 1, 3),
  
  -- ECE Assignments
  ('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440044', '2024-25', 1, 3),
  ('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440044', '2024-25', 1, 2),
  ('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440044', '2024-25', 1, 3),
  
  -- ME Assignments
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440046', '2024-25', 1, 3),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440046', '2024-25', 1, 3),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440046', '2024-25', 1, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert some sample leaves for testing
INSERT INTO public.leaves (id, faculty_id, leave_type, start_date, end_date, reason, status, substitute_faculty_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440021', 'sick', '2024-09-20', '2024-09-20', 'Medical emergency', 'approved', '550e8400-e29b-41d4-a716-446655440022'),
  ('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440023', 'casual', '2024-09-25', '2024-09-25', 'Personal work', 'pending', null)
ON CONFLICT (id) DO NOTHING;
