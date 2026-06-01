-- Add email notification preferences to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_time time NOT NULL DEFAULT '08:00:00';

COMMENT ON COLUMN public.profiles.email_notifications_enabled IS 'Whether the user wants daily task digest emails';
COMMENT ON COLUMN public.profiles.notification_time IS 'Time of day (in UTC) to send the digest email';
