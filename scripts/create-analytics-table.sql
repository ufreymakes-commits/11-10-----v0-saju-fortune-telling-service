-- Analytics events table for tracking user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL, -- 'page_view', 'form_submit', 'share', 'payment', 'shopify_click', 'paid_report_share'
  page text,
  metadata jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at);

-- Allow anon inserts (tracking), no reads for anon
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert" ON analytics_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow service role all" ON analytics_events
  FOR ALL TO service_role USING (true);
