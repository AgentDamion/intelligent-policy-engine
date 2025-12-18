-- Add agent metadata columns to sandbox_runs table
ALTER TABLE sandbox_runs 
ADD COLUMN IF NOT EXISTS agent_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS agent_confidence NUMERIC(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS agent_reasoning TEXT;

-- Add index for agent metadata queries
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_agent_metadata ON sandbox_runs USING GIN (agent_metadata);

-- Add comment for documentation
COMMENT ON COLUMN sandbox_runs.agent_metadata IS 'Stores multi-agent coordination data including agent sequence, actions, and results';
COMMENT ON COLUMN sandbox_runs.agent_confidence IS 'Aggregated confidence score from all agents involved in the simulation (0.00-1.00)';
COMMENT ON COLUMN sandbox_runs.agent_reasoning IS 'Combined reasoning and insights from all agents that participated in the simulation';