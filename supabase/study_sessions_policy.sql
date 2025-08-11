-- Enable Row Level Security for study_sessions table
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own study sessions
CREATE POLICY "Users can view their own study sessions" ON public.study_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy for users to insert their own study sessions
CREATE POLICY "Users can insert their own study sessions" ON public.study_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy for users to update their own study sessions
CREATE POLICY "Users can update their own study sessions" ON public.study_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy for users to delete their own study sessions
CREATE POLICY "Users can delete their own study sessions" ON public.study_sessions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());