-- Add rating column to userbooks
ALTER TABLE userbooks 
ADD COLUMN rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5);
