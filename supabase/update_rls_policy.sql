-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert their own scores" ON public.exam_scores;

-- Create a new policy that allows users to insert scores without requiring them to be participants first
CREATE POLICY "Users can insert their own scores" ON public.exam_scores 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  (room_id IN (
    SELECT room_id FROM public.room_participants WHERE user_id = auth.uid()
  ) OR TRUE) -- Allow users to insert scores even if they're not participants yet
);