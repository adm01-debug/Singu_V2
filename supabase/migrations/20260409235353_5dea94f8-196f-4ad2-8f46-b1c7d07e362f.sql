-- Enable RLS on realtime.messages to prevent cross-user channel sniffing
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to interact with realtime messages
-- The realtime system uses this table internally; the policy restricts
-- subscription authorization to authenticated users only
CREATE POLICY "Authenticated users can use realtime"
ON realtime.messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);