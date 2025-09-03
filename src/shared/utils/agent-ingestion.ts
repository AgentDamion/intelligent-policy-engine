/**
 * Agent Ingestion Helper
 * Provides easy methods for agents to POST activities and decisions to Supabase Edge Functions
 */

interface AgentActivity {
  agent: string;
  action: string;
  status?: 'success' | 'warning' | 'running' | 'error' | 'active' | 'healthy';
  details?: Record<string, any>;
  workspace_id?: string;
  enterprise_id?: string;
}

interface AgentDecision {
  agent: string;
  action: string;
  agency?: string;
  outcome: string;
  risk?: 'low' | 'medium' | 'high';
  details?: Record<string, any>;
  enterprise_id?: string;
}

class AgentIngestion {
  private supabaseUrl: string;
  private agentKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.agentKey = process.env.AGENT_INGEST_KEY || '';
    
    if (!this.supabaseUrl || !this.agentKey) {
      console.warn('AgentIngestion: SUPABASE_URL or AGENT_INGEST_KEY not configured');
    }
  }

  /**
   * Post an agent activity to Supabase
   */
  async postActivity(activity: AgentActivity): Promise<boolean> {
    if (!this.supabaseUrl || !this.agentKey) {
      console.warn('AgentIngestion: Cannot post activity - configuration missing');
      return false;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/ingest_agent_activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Key': this.agentKey,
        },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to post agent activity:', error);
        return false;
      }

      const result = await response.json();
      console.log('Agent activity posted successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('Error posting agent activity:', error);
      return false;
    }
  }

  /**
   * Post an AI agent decision to Supabase
   */
  async postDecision(decision: AgentDecision): Promise<boolean> {
    if (!this.supabaseUrl || !this.agentKey) {
      console.warn('AgentIngestion: Cannot post decision - configuration missing');
      return false;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/ingest_ai_decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Key': this.agentKey,
        },
        body: JSON.stringify(decision),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to post AI decision:', error);
        return false;
      }

      const result = await response.json();
      console.log('AI decision posted successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('Error posting AI decision:', error);
      return false;
    }
  }

  /**
   * Log a simple agent action (convenience method)
   */
  async logAction(agentName: string, action: string, status: 'success' | 'warning' | 'running' | 'error' | 'active' | 'healthy' = 'success', details?: Record<string, any>): Promise<boolean> {
    return this.postActivity({
      agent: agentName,
      action,
      status,
      details,
    });
  }

  /**
   * Log a decision made by an AI agent (convenience method)
   */
  async logDecision(agentName: string, action: string, outcome: string, risk: 'low' | 'medium' | 'high' = 'medium', details?: Record<string, any>): Promise<boolean> {
    return this.postDecision({
      agent: agentName,
      action,
      outcome,
      risk,
      details,
    });
  }
}

// Export singleton instance
export const agentIngestion = new AgentIngestion();
export default agentIngestion;
