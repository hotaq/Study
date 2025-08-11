-- Create subjects table
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);

-- Add default subjects
INSERT INTO public.subjects (name, description, color) VALUES
('Mathematics', 'Math, algebra, calculus, and statistics', 'bg-primary/10 text-primary'),
('Science', 'Physics, chemistry, biology, and other sciences', 'bg-destructive/10 text-destructive'),
('Languages', 'English, Spanish, French, and other languages', 'bg-focus/10 text-focus'),
('Programming', 'Coding, software development, and computer science', 'bg-secondary/10 text-secondary'),
('Arts', 'Drawing, painting, music, and other creative arts', 'bg-success/10 text-success'),
('History', 'World history, civilizations, and historical events', 'bg-purple-500/10 text-purple-500'),
('Literature', 'Books, poetry, and literary analysis', 'bg-amber-500/10 text-amber-500'),
('Business', 'Economics, finance, marketing, and management', 'bg-blue-500/10 text-blue-500');

-- Add subject_id to study_sessions table
ALTER TABLE public.study_sessions ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Enable RLS for subjects table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create subjects" ON public.subjects FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Subject creators can update their subjects" ON public.subjects FOR UPDATE USING (
  created_by = auth.uid()
);
CREATE POLICY "Subject creators can delete their subjects" ON public.subjects FOR DELETE USING (
  created_by = auth.uid()
);