-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- User profiles table to store additional user information
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  stats_private boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Rooms table
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  participants jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  preset text,
  is_private boolean DEFAULT false,
  max_participants integer CHECK (max_participants IS NULL OR max_participants > 0),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);

-- Room participants table for better querying
CREATE TABLE public.room_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_participants_pkey PRIMARY KEY (id),
  CONSTRAINT unique_room_user UNIQUE (room_id, user_id)
);

-- Study sessions table for analytics
CREATE TABLE public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_sessions_pkey PRIMARY KEY (id)
);

-- Exam scores table for goal tracking
CREATE TABLE public.exam_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  score integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_scores_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_room_score UNIQUE (user_id, room_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for rooms
CREATE POLICY "Anyone can view public rooms" ON public.rooms FOR SELECT USING (
  is_private = false OR created_by = auth.uid()
);
CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Room creators can update their rooms" ON public.rooms FOR UPDATE USING (
  created_by = auth.uid()
);
CREATE POLICY "Room creators can delete their rooms" ON public.rooms FOR DELETE USING (
  created_by = auth.uid()
);

-- RLS Policies for room participants
CREATE POLICY "Anyone can view room participants" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join rooms" ON public.room_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users can leave rooms" ON public.room_participants FOR DELETE USING (
  user_id = auth.uid()
);

-- RLS Policies for study sessions
CREATE POLICY "Users can view their own sessions" ON public.study_sessions FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Users can create their own sessions" ON public.study_sessions FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- RLS Policies for exam scores
CREATE POLICY "Users can view scores in their rooms" ON public.exam_scores FOR SELECT USING (
  room_id IN (
    SELECT room_id FROM public.room_participants WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own scores" ON public.exam_scores FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  (room_id IN (
    SELECT room_id FROM public.room_participants WHERE user_id = auth.uid()
  ) OR TRUE) -- Allow users to insert scores even if they're not participants yet
);
CREATE POLICY "Users can update their own scores" ON public.exam_scores FOR UPDATE USING (
  user_id = auth.uid()
);
CREATE POLICY "Users can delete their own scores" ON public.exam_scores FOR DELETE USING (
  user_id = auth.uid()
);

-- Create trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policy for avatars
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );