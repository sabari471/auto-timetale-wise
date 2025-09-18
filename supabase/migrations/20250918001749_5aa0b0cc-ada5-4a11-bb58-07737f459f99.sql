-- Fix foreign key constraint issues and create proper relationships

-- Drop existing constraints that might be causing issues
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with proper structure
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  department text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Update faculty table to reference profiles properly
ALTER TABLE public.faculty DROP CONSTRAINT IF EXISTS faculty_profile_id_fkey;
ALTER TABLE public.faculty ADD CONSTRAINT faculty_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create leaves table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  substitute_faculty_id uuid REFERENCES public.faculty(id),
  approved_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on leaves
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Create policies for leaves
CREATE POLICY "Faculty can manage their own leaves" 
ON public.leaves 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM faculty f 
  WHERE f.id = leaves.faculty_id 
  AND f.profile_id IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage all leaves" 
ON public.leaves 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Add trigger for leaves timestamps
CREATE TRIGGER update_leaves_updated_at
BEFORE UPDATE ON public.leaves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();