-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subject_id to study_sessions table
ALTER TABLE study_sessions ADD COLUMN subject_id UUID REFERENCES subjects(id);

-- Insert default subjects
INSERT INTO subjects (name, color) VALUES
  ('Study', '#4f46e5'),
  ('Exam Prep', '#ef4444'),
  ('Reading', '#10b981'),
  ('Coding', '#6366f1'),
  ('Homework', '#f59e0b'),
  ('Language', '#8b5cf6'),
  ('Research', '#ec4899'),
  ('Writing', '#0ea5e9'),
  ('Project', '#14b8a6'),
  ('Other', '#6b7280');

-- Enable RLS on subjects table
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read subjects
CREATE POLICY "Subjects are viewable by all users"
  ON subjects
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert subjects
CREATE POLICY "Authenticated users can insert subjects"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);