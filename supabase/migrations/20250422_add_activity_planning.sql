
-- Add activity_planning table
CREATE TABLE IF NOT EXISTS activity_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  planning_type TEXT NOT NULL,
  distribution_type TEXT NOT NULL,
  daily_goal NUMERIC,
  weekly_goal NUMERIC,
  monthly_goal NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER set_activity_planning_updated_at
BEFORE UPDATE ON activity_planning
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Add indexes for better performance
CREATE INDEX idx_activity_planning_activity_id ON activity_planning(activity_id);
CREATE INDEX idx_activity_planning_project_id ON activity_planning(project_id);

-- Add RLS policies for activity_planning table
ALTER TABLE activity_planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select activity_planning"
  ON activity_planning
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert own activity_planning"
  ON activity_planning
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow authenticated users to update own activity_planning"
  ON activity_planning
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);
