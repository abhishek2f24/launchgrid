-- Migration 0019: device registry for mobile push notifications + multi-device view
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  push_token TEXT NOT NULL,
  device_name TEXT,
  app_version TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, push_token)
);

CREATE INDEX IF NOT EXISTS devices_tenant_idx ON devices(tenant_id);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own devices" ON devices;
CREATE POLICY "Users manage own devices" ON devices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
