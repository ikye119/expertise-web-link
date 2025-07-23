-- Add fields to support weighted match scoring

-- Add skill level (1-5) and urgency (1-3) to skills table
ALTER TABLE public.skills 
ADD COLUMN skill_level INTEGER DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 5),
ADD COLUMN urgency INTEGER DEFAULT 1 CHECK (urgency >= 1 AND urgency <= 3);

-- Add timezone to profiles table
ALTER TABLE public.profiles 
ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Add index for better performance on matching queries
CREATE INDEX idx_skills_matching ON public.skills(skill_name, is_teaching, is_learning);
CREATE INDEX idx_profiles_timezone ON public.profiles(timezone);