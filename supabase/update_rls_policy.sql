-- Update RLS policy to allow viewing stats of users in the same room

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own study sessions" ON public.study_sessions;

-- Create new policy that allows viewing own sessions AND sessions of users in the same room
CREATE POLICY "Users can view study sessions in shared rooms" ON public.study_sessions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.room_participants rp1
    JOIN public.room_participants rp2 ON rp1.room_id = rp2.room_id
    WHERE rp1.user_id = auth.uid() 
    AND rp2.user_id = study_sessions.user_id
  )
);