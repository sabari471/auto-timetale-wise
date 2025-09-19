-- Seed minimal data for immediate timetable generation
-- Departments
WITH d AS (
  INSERT INTO public.departments (id, name, code)
  VALUES
    (gen_random_uuid(), 'Computer Science and Engineering', 'CSE'),
    (gen_random_uuid(), 'Electronics and Communication', 'ECE')
  RETURNING id, name, code
)
SELECT 1;

-- Rooms
WITH dept AS (
  SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1
)
INSERT INTO public.rooms (name, code, capacity, room_type, is_active, department_id, facilities)
VALUES
  ('Main Lecture Hall 1', 'LH-101', 60, 'lecture', true, (SELECT id FROM dept), ARRAY['projector','ac']::text[]),
  ('Main Lecture Hall 2', 'LH-102', 50, 'lecture', true, (SELECT id FROM dept), ARRAY['projector']::text[]),
  ('Computer Lab 1', 'LAB-C1', 40, 'lab', true, (SELECT id FROM dept), ARRAY['computers','ac']::text[]);

-- Profiles (faculty)
WITH p AS (
  INSERT INTO public.profiles (id, user_id, full_name, email, role, department)
  VALUES
    (gen_random_uuid(), gen_random_uuid()::text, 'Dr. Alice Johnson', 'alice@example.edu', 'faculty', 'CSE'),
    (gen_random_uuid(), gen_random_uuid()::text, 'Prof. Bob Smith', 'bob@example.edu', 'faculty', 'CSE'),
    (gen_random_uuid(), gen_random_uuid()::text, 'Dr. Carol Davis', 'carol@example.edu', 'faculty', 'CSE')
  RETURNING id, full_name
)
SELECT 1;

-- Faculty rows
WITH dept AS (
  SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1
),
pf AS (
  SELECT id, full_name FROM public.profiles WHERE full_name IN ('Dr. Alice Johnson','Prof. Bob Smith','Dr. Carol Davis')
)
INSERT INTO public.faculty (profile_id, employee_id, department_id, designation, is_active, max_hours_per_week, specialization)
SELECT
  (SELECT id FROM pf WHERE full_name = 'Dr. Alice Johnson'), 'EMP-CSE-001', (SELECT id FROM dept), 'Assistant Professor', true, 16, ARRAY['Programming','Data Structures']::text[]
UNION ALL
SELECT
  (SELECT id FROM pf WHERE full_name = 'Prof. Bob Smith'), 'EMP-CSE-002', (SELECT id FROM dept), 'Associate Professor', true, 18, ARRAY['Algorithms','Systems']::text[]
UNION ALL
SELECT
  (SELECT id FROM pf WHERE full_name = 'Dr. Carol Davis'), 'EMP-CSE-003', (SELECT id FROM dept), 'Professor', true, 20, ARRAY['Databases','ML']::text[];

-- Batch for 2024-25 Semester 1
INSERT INTO public.batches (name, section, year, semester, student_count, is_active, department_id)
VALUES ('CS-A 2024', 'A', 2024, 1, 45, true, (SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1));

-- Courses (Semester 1)
INSERT INTO public.courses (name, code, course_type, credits, semester, is_active, department_id, duration_minutes)
VALUES
  ('Programming 101', 'CSE101', 'theory', 4, 1, true, (SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1), 60),
  ('Data Structures', 'CSE102', 'theory', 4, 1, true, (SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1), 60),
  ('Programming Lab', 'CSE101L', 'lab', 2, 1, true, (SELECT id FROM public.departments WHERE code = 'CSE' LIMIT 1), 120);

-- Course assignments for academic year 2024-25, semester 1
WITH b AS (
  SELECT id FROM public.batches WHERE name = 'CS-A 2024' LIMIT 1
),
f AS (
  SELECT f.id, p.full_name
  FROM public.faculty f
  JOIN public.profiles p ON p.id = f.profile_id
  WHERE p.full_name IN ('Dr. Alice Johnson','Prof. Bob Smith','Dr. Carol Davis')
),
c AS (
  SELECT id, code FROM public.courses WHERE code IN ('CSE101','CSE102','CSE101L')
)
INSERT INTO public.course_assignments (academic_year, semester, batch_id, course_id, faculty_id, hours_per_week)
SELECT '2024-25', 1, (SELECT id FROM b), (SELECT id FROM c WHERE code = 'CSE101'), (SELECT id FROM f WHERE full_name = 'Dr. Alice Johnson'), 3
UNION ALL
SELECT '2024-25', 1, (SELECT id FROM b), (SELECT id FROM c WHERE code = 'CSE102'), (SELECT id FROM f WHERE full_name = 'Prof. Bob Smith'), 3
UNION ALL
SELECT '2024-25', 1, (SELECT id FROM b), (SELECT id FROM c WHERE code = 'CSE101L'), (SELECT id FROM f WHERE full_name = 'Dr. Carol Davis'), 2;

-- Done

