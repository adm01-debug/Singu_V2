-- Drop the overly permissive realtime policy
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;

-- Create a scoped policy: users can only access channels containing their own user ID
CREATE POLICY "Users can only access their own realtime channels"
ON realtime.messages
FOR ALL
TO authenticated
USING (
  -- Allow access only when the channel topic contains the user's ID
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
)
WITH CHECK (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);