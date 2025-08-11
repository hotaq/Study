-- Fix RLS policy to allow viewing study sessions from users in the same room
-- This will resolve the "database restrictions" issue when viewing other users' stats

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can view study sessions in shared rooms" ON public.study_sessions;

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

-- Verify the policy was created
\d+ public.study_sessions

-- Test query to verify access (replace with actual user IDs)
-- SELECT user_id, COUNT(*) as session_count, SUM(duration_minutes) as total_minutes
-- FROM public.study_sessions 
-- GROUP BY user_id;