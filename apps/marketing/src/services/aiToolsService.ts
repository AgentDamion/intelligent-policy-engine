import { supabase } from "@/integrations/supabase/client";
import { AITool, AIToolVersion } from "@/types/aiTools";

export class AIToolsService {
  /**
   * Get all AI tools
   */
  static async getTools(): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get a single AI tool by ID
   */
  static async getTool(id: string): Promise<AITool | null> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  /**
   * Get all versions for a specific tool
   */
  static async getToolVersions(toolId: string): Promise<AIToolVersion[]> {
    const { data, error } = await supabase
      .from('ai_tool_versions' as any)
      .select('*')
      .eq('tool_id', toolId)
      .order('release_date', { ascending: false });

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get a specific tool version
   */
  static async getToolVersion(versionId: string): Promise<AIToolVersion | null> {
    const { data, error } = await supabase
      .from('ai_tool_versions' as any)
      .select(`
        *,
        tool:tool_id(*)
      `)
      .eq('id', versionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  /**
   * Get all tool versions across all tools
   */
  static async getAllToolVersions(): Promise<AIToolVersion[]> {
    const { data, error } = await supabase
      .from('ai_tool_versions' as any)
      .select(`
        *,
        tool:tool_id(*)
      `)
      .order('release_date', { ascending: false });

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get tools by category
   */
  static async getToolsByCategory(category: string): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get tools by risk tier
   */
  static async getToolsByRiskTier(riskTier: string): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .eq('risk_tier', riskTier)
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get tools by deployment status
   */
  static async getToolsByDeploymentStatus(status: string): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .eq('deployment_status', status)
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get approved tools only (excludes banned/draft)
   */
  static async getApprovedTools(): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .eq('deployment_status', 'approved')
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Get banned tools (for policy violation alerts)
   */
  static async getBannedTools(): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('*')
      .eq('deployment_status', 'banned')
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  }

  /**
   * Check if a tool is approved for use
   */
  static async isToolApproved(toolId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('ai_tool_registry' as any)
      .select('deployment_status')
      .eq('id', toolId)
      .single();

    if (error) return false;
    return (data as any)?.deployment_status === 'approved';
  }

  /**
   * Get latest version for a tool
   */
  static async getLatestVersion(toolId: string): Promise<AIToolVersion | null> {
    const { data, error } = await supabase
      .from('ai_tool_versions' as any)
      .select('*')
      .eq('tool_id', toolId)
      .order('release_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }
}
