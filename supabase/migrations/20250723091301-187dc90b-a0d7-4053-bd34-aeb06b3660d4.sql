-- Enhance profiles table for better user profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available';

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'skill_request', 'message_received', 'request_accepted', 'request_declined'
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid, -- ID of related object (skill_request, message, etc.)
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enhance skill_requests table to include skill information
ALTER TABLE public.skill_requests 
ADD COLUMN IF NOT EXISTS skill_offered text,
ADD COLUMN IF NOT EXISTS skill_wanted text,
ADD COLUMN IF NOT EXISTS message text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_skills_teaching ON public.skills(is_teaching) WHERE is_teaching = true;
CREATE INDEX IF NOT EXISTS idx_skills_learning ON public.skills(is_learning) WHERE is_learning = true;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;