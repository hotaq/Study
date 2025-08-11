-- Add privacy setting to profiles table
ALTER TABLE public.profiles ADD COLUMN stats_private boolean DEFAULT false;

-- Update the RLS policy comment for clarity
COMMENT ON COLUMN public.profiles.stats_private IS 'When true, user statistics are hidden from other users in rooms';