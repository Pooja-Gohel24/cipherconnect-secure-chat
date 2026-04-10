-- Fix role column and group admins
-- Run this in your PostgreSQL database

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='conversation_participants' AND column_name='role') THEN
        ALTER TABLE conversation_participants ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'member';
    END IF;
END $$;

-- Update existing group creators to be admins
UPDATE conversation_participants 
SET role = 'admin' 
WHERE user_id IN (
    SELECT created_by 
    FROM conversations 
    WHERE conversations.id = conversation_participants.conversation_id 
    AND conversations.type = 'group'
);

-- Verify the changes
SELECT 
    c.name as group_name,
    c.created_by,
    cp.user_id,
    cp.role,
    u.username
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN users u ON cp.user_id = u.id
WHERE c.type = 'group'
ORDER BY c.name, cp.role DESC;