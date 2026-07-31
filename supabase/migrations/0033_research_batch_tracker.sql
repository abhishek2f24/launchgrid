-- Checkpointed live-research queue. One row represents one product/source capture.
-- The queue is deliberately independent from supplier evidence so blocked or
-- unavailable sources are recorded without fabricating a supplier row.
CREATE TABLE IF NOT EXISTS research_batch_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_project_id uuid NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  product_idea_id uuid NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  batch_number integer NOT NULL CHECK (batch_number > 0),
  batch_size integer NOT NULL DEFAULT 10 CHECK (batch_size = 10),
  source_name text NOT NULL CHECK (source_name IN ('alibaba','indiamart','made_in_china','amazon_in','flipkart')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','partial','rate_limited','captcha_blocked','failed','unavailable')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  records_found integer NOT NULL DEFAULT 0,
  records_saved integer NOT NULL DEFAULT 0,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_idea_id, source_name)
);

CREATE INDEX IF NOT EXISTS research_batch_tasks_batch_idx
  ON research_batch_tasks (research_project_id, batch_number, status);

ALTER TABLE research_batch_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_batch_tasks_owner_read" ON research_batch_tasks;
CREATE POLICY "research_batch_tasks_owner_read" ON research_batch_tasks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM research_projects rp
    WHERE rp.id = research_batch_tasks.research_project_id
      AND rp.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "research_batch_tasks_owner_write" ON research_batch_tasks;
CREATE POLICY "research_batch_tasks_owner_write" ON research_batch_tasks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM research_projects rp
    WHERE rp.id = research_batch_tasks.research_project_id
      AND rp.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM research_projects rp
    WHERE rp.id = research_batch_tasks.research_project_id
      AND rp.user_id = auth.uid()
  ));
