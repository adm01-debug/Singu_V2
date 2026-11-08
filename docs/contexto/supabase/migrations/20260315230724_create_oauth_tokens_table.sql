CREATE TABLE IF NOT EXISTS oauth_tokens (
  service TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO oauth_tokens (service, access_token, refresh_token, expires_at)
VALUES (
  'bitrix24',
  'f248b769007ec2ef00401b1400000001a0ab079185272769ce4838298beb0b91080261',
  'e2c7de69007ec2ef00401b1400000001a0ab072ce6cd3fd16b7e72ebc768b55181f81b',
  NOW() + INTERVAL '1 hour'
) ON CONFLICT (service) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();
