-- Update events table to support fan events and additional fields
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) DEFAULT 'official',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_events_type_status ON events(event_type, status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Update existing events to be official type
UPDATE events SET event_type = 'official' WHERE event_type IS NULL;

-- Add some sample fan events for testing
INSERT INTO events (title, content, description, event_type, status, created_by, event_date) 
SELECT 
  'Fan Art Contest 2026',
  'Join our amazing fan art contest! Show your love for Peanut through your artistic skills. Winners will receive exclusive merchandise and recognition!',
  'Annual fan art competition',
  'fan',
  'approved',
  id,
  '2026-02-20 10:00:00'
FROM users 
WHERE email = 'admin@example.com' 
LIMIT 1;

INSERT INTO events (title, content, description, event_type, status, created_by, event_date) 
SELECT 
  'Peanut Gameplay Analysis Discussion',
  'Let''s discuss Peanut''s recent gameplay and strategies. What do you think about his new champion picks? Share your insights and analysis!',
  'Community discussion about recent gameplay',
  'fan',
  'pending',
  id,
  '2026-02-25 15:00:00'
FROM users 
WHERE email = 'admin@example.com' 
LIMIT 1;