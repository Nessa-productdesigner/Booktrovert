-- Add custom_message column to share_links
ALTER TABLE share_links 
ADD COLUMN custom_message TEXT;
