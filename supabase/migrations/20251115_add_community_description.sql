-- Add description field to community settings
alter table community_settings 
add column if not exists description text;

-- Update the updated_at trigger to fire on description changes too
-- (The existing trigger already handles all column updates)