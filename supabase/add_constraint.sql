ALTER TABLE public.exam_scores ADD CONSTRAINT unique_user_room_score UNIQUE (user_id, room_id);
