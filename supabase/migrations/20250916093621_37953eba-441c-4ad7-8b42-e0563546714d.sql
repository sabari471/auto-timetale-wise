-- Insert sample departments
INSERT INTO public.departments (name, code) VALUES
('Computer Science', 'CS'),
('Mathematics', 'MATH'),
('Physics', 'PHY'),
('Chemistry', 'CHEM'),
('Electronics', 'ECE');

-- Insert sample rooms
INSERT INTO public.rooms (name, code, capacity, room_type, facilities) VALUES
('Main Lecture Hall', 'LH-001', 150, 'auditorium', ARRAY['Projector', 'Sound System', 'AC']),
('Computer Lab 1', 'CL-101', 50, 'lab', ARRAY['Computers', 'Projector', 'AC']),
('Physics Lab', 'PL-201', 30, 'lab', ARRAY['Lab Equipment', 'Safety Gear']),
('Mathematics Room', 'MR-301', 60, 'classroom', ARRAY['Whiteboard', 'Projector']),
('Chemistry Lab', 'CH-401', 25, 'lab', ARRAY['Fume Hoods', 'Lab Equipment']),
('Seminar Room A', 'SR-A01', 40, 'seminar', ARRAY['Round Tables', 'Projector']),
('Conference Hall', 'CH-001', 200, 'auditorium', ARRAY['Stage', 'Sound System', 'Recording']),
('Tutorial Room 1', 'TR-101', 25, 'classroom', ARRAY['Whiteboard', 'Comfortable Seating']);

-- Insert sample courses
INSERT INTO public.courses (name, code, credits, course_type, semester, duration_minutes) VALUES
('Data Structures and Algorithms', 'CS-201', 4, 'theory', 3, 60),
('Database Management Systems', 'CS-301', 3, 'theory', 5, 60),
('Computer Networks', 'CS-401', 3, 'theory', 7, 60),
('Operating Systems', 'CS-302', 4, 'theory', 5, 60),
('Software Engineering', 'CS-402', 3, 'theory', 7, 60),
('Machine Learning', 'CS-501', 4, 'theory', 9, 60),
('Programming Lab', 'CS-291', 2, 'lab', 3, 120),
('DBMS Lab', 'CS-391', 1, 'lab', 5, 120),
('Networks Lab', 'CS-491', 1, 'lab', 7, 120),
('Mathematics III', 'MATH-301', 4, 'theory', 5, 60),
('Physics II', 'PHY-201', 3, 'theory', 3, 60),
('Chemistry I', 'CHEM-101', 3, 'theory', 1, 60);

-- Insert sample batches
INSERT INTO public.batches (name, year, semester, section, student_count) VALUES
('CS-A 2024', 2024, 3, 'A', 45),
('CS-B 2024', 2024, 3, 'B', 42),
('CS-A 2023', 2023, 5, 'A', 38),
('CS-B 2023', 2023, 5, 'B', 40),
('CS-A 2022', 2022, 7, 'A', 35),
('MATH-A 2024', 2024, 3, 'A', 30),
('PHY-A 2024', 2024, 3, 'A', 28);

-- Insert default constraints for timetable generation
INSERT INTO public.constraints (name, type, description, config) VALUES
('No Back-to-Back Labs', 'hard', 'Prevent scheduling lab sessions back-to-back', 
 '{"type": "no_consecutive", "applies_to": "lab", "gap_minutes": 30}'),
('Maximum 4 Hours Per Day', 'soft', 'Limit teaching hours per faculty per day', 
 '{"type": "max_hours_per_day", "value": 4, "applies_to": "faculty"}'),
('Lunch Break Mandatory', 'hard', 'Ensure lunch break between 12:00-13:00', 
 '{"type": "mandatory_break", "start_time": "12:00", "end_time": "13:00"}'),
('Room Capacity Check', 'hard', 'Ensure room capacity matches batch size', 
 '{"type": "capacity_check", "buffer_percentage": 10}'),
('Faculty Preferred Timings', 'soft', 'Consider faculty preferred time slots', 
 '{"type": "preference_weight", "weight": 0.7}');

-- Insert a sample timetable run
INSERT INTO public.timetable_runs (name, academic_year, semester, status, generation_config) VALUES
('Fall 2024 - CS Department', '2024-25', 1, 'completed', 
 '{"algorithm": "genetic", "max_iterations": 1000, "population_size": 50, "mutation_rate": 0.1}');