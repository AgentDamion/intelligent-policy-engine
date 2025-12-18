// AI Tools Registry Types

export type ToolCategory = 'llm' | 'image_gen' | 'video_gen' | 'audio_gen' | 'code_assist' | 'analytics' | 'automation';
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DeploymentStatus = 'draft' | 'approved' | 'banned' | 'deprecated';

export interface AITool {
  id: string;
  name: string;
  provider: string;
  category: ToolCategory;
  risk_tier?: RiskTier;
  deployment_status?: DeploymentStatus;
  jurisdictions?: string[];
  data_sensitivity_used?: string[];
  description?: string;
  created_at: string;
}

export interface AIToolVersion {
  id: string;
  tool_id: string;
  version: string;
  release_date: string;
  deprecates_version_id?: string;
  capabilities: Record<string, any>;
  known_limitations: string[];
  notes?: string;
  created_at: string;
}

// Type already defined above, removing duplicate
