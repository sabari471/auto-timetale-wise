-- Enhanced Semester 5 Data for Complete Timetable Generation
-- This migration adds more faculty and course assignments for semester 5 to fill all timetable cells

-- Add 2 more faculty members to reach 7 total
INSERT INTO public.profiles (id, user_id, email, full_name, role, department, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440016', '66666666-6666-6666-6666-666666666666', 'dr.garcia@university.edu', 'Dr. Maria Garcia', 'faculty', 'CSE', '+1234567896'),
  ('550e8400-e29b-41d4-a716-446655440017', '77777777-7777-7777-7777-777777777777', 'prof.lee@university.edu', 'Prof. David Lee', 'faculty', 'CSE', '+1234567897')
ON CONFLICT (id) DO NOTHING;

-- Add faculty records for the new faculty
INSERT INTO public.faculty (id, profile_id, employee_id, department_id, designation, specialization, max_hours_per_week, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440016', 'FAC006', '550e8400-e29b-41d4-a716-446655440001', 'Assistant Professor', ARRAY['Web Development', 'Mobile Apps', 'UI/UX'], 18, true),
  ('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440017', 'FAC007', '550e8400-e29b-41d4-a716-446655440001', 'Associate Professor', ARRAY['Cybersecurity', 'Network Security', 'Ethical Hacking'], 18, true)
ON CONFLICT (id) DO NOTHING;

-- Add more courses for semester 5
INSERT INTO public.courses (id, name, code, credits, course_type, department_id, duration_minutes, prerequisites, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440059', 'Advanced Web Development', 'CSE401', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE103'], true),
  ('550e8400-e29b-41d4-a716-446655440060', 'Web Development Lab', 'CSE401L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440001', 120, ARRAY['CSE401'], true),
  ('550e8400-e29b-41d4-a716-446655440061', 'Cybersecurity Fundamentals', 'CSE402', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE201'], true),
  ('550e8400-e29b-41d4-a716-446655440062', 'Cybersecurity Lab', 'CSE402L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440001', 120, ARRAY['CSE402'], true),
  ('550e8400-e29b-41d4-a716-446655440063', 'Mobile Application Development', 'CSE403', 3, 'theory', '550e8400-e29b-41d4-a716-446655440001', 60, ARRAY['CSE103'], true),
  ('550e8400-e29b-41d4-a716-446655440064', 'Mobile App Lab', 'CSE403L', 1, 'lab', '550e8400-e29b-41d4-a716-446655440001', 120, ARRAY['CSE403'], true)
ON CONFLICT (id) DO NOTHING;

-- Create a comprehensive batch for semester 5
INSERT INTO public.batches (id, name, year, semester, section, department_id, student_count, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440047', 'CS-A 2022', 2022, 5, 'A', '550e8400-e29b-41d4-a716-446655440001', 50, true)
ON CONFLICT (id) DO NOTHING;

-- Create comprehensive course assignments for semester 5 with 6 courses and 7 faculty
INSERT INTO public.course_assignments (id, course_id, faculty_id, batch_id, academic_year, semester, hours_per_week) VALUES
  -- Course 1: Data Structures and Algorithms (4 hours/week) - Dr. John Smith
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 4),
  
  -- Course 2: Database Management Systems (4 hours/week) - Prof. Sarah Jones
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 4),
  
  -- Course 3: Software Engineering (3 hours/week) - Dr. Michael Brown
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 3),
  
  -- Course 4: Advanced Web Development (4 hours/week) - Dr. Maria Garcia
  ('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440059', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 4),
  
  -- Course 5: Cybersecurity Fundamentals (3 hours/week) - Prof. David Lee
  ('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 3),
  
  -- Course 6: Mobile Application Development (3 hours/week) - Prof. Emily Wilson
  ('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 3),
  
  -- Additional assignments to utilize all 7 faculty and fill more slots
  -- Dr. Robert Davis - Data Structures Lab (2 hours/week)
  ('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 2),
  
  -- Dr. John Smith - Database Lab (2 hours/week) - Additional assignment
  ('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 2),
  
  -- Prof. Sarah Jones - Web Development Lab (2 hours/week)
  ('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 2),
  
  -- Dr. Michael Brown - Cybersecurity Lab (2 hours/week)
  ('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 2),
  
  -- Dr. Maria Garcia - Mobile App Lab (2 hours/week)
  ('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 2),
  
  -- Prof. David Lee - Computer Networks (3 hours/week) - Additional assignment
  ('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440056', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 3),
  
  -- Prof. Emily Wilson - Operating Systems (3 hours/week) - Additional assignment
  ('550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440057', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 3),
  
  -- Dr. Robert Davis - Machine Learning (3 hours/week) - Additional assignment
  ('550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440058', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440047', '2024-25', 5, 3)
ON CONFLICT (id) DO NOTHING;
