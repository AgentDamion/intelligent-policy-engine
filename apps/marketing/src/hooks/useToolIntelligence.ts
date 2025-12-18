import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ToolRiskData {
  id: string;
  toolName: string;
  vendor: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  usageCount: number;
  lastUsed: string;
  complianceStatus: string;
  vulnerabilities: number;
}

export interface VendorAnalytics {
  vendorName: string;
  toolCount: number;
  avgRiskScore: number;
  totalUsage: number;
  complianceRate: number;
  marketShare: number;
}

export interface AdoptionMetrics {
  totalTools: number;
  activeTools: number;
  toolsAdded30d: number;
  avgUsagePerTool: number;
  topTools: { name: string; usage: number }[];
}

export interface ToolIntelligenceData {
  toolRiskMatrix: ToolRiskData[];
  vendorAnalytics: VendorAnalytics[];
  adoptionMetrics: AdoptionMetrics;
  loading: boolean;
  error: string | null;
}

export const useToolIntelligence = (enterpriseId?: string) => {
  const [toolUsageLogs, setToolUsageLogs] = useState<any[]>([]);
  const [projectUsage, setProjectUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch AI tool usage logs
      const { data: logs, error: logsError } = await supabase
        .from('ai_tool_usage_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (logsError) throw logsError;

      // Fetch project AI tool usage
      const { data: projectData, error: projectError } = await supabase
        .from('project_ai_tool_usage')
        .select('*')
        .order('last_used', { ascending: false });

      if (projectError) throw projectError;

      setToolUsageLogs(logs || []);
      setProjectUsage(projectData || []);
    } catch (err) {
      console.error('Error fetching tool intelligence data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const intelligenceData = useMemo((): ToolIntelligenceData => {
    if (!projectUsage.length && !toolUsageLogs.length) {
      return {
        toolRiskMatrix: [],
        vendorAnalytics: [],
        adoptionMetrics: {
          totalTools: 0,
          activeTools: 0,
          toolsAdded30d: 0,
          avgUsagePerTool: 0,
          topTools: []
        },
        loading,
        error
      };
    }

    // Calculate tool risk matrix
    const toolRiskMatrix: ToolRiskData[] = projectUsage.map(tool => {
      const riskScore = calculateRiskScore(tool.risk_level, tool.compliance_status);
      return {
        id: tool.id,
        toolName: tool.tool_name,
        vendor: tool.vendor_name || 'Unknown',
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        usageCount: tool.usage_count || 0,
        lastUsed: tool.last_used || tool.updated_at,
        complianceStatus: tool.compliance_status || 'unknown',
        vulnerabilities: tool.policy_violations?.length || 0
      };
    });

    // Calculate vendor analytics
    const vendorMap = new Map<string, {
      tools: ToolRiskData[];
      totalUsage: number;
    }>();

    toolRiskMatrix.forEach(tool => {
      const vendor = tool.vendor;
      if (!vendorMap.has(vendor)) {
        vendorMap.set(vendor, { tools: [], totalUsage: 0 });
      }
      const vendorData = vendorMap.get(vendor)!;
      vendorData.tools.push(tool);
      vendorData.totalUsage += tool.usageCount;
    });

    const totalUsageAllVendors = Array.from(vendorMap.values())
      .reduce((sum, v) => sum + v.totalUsage, 0);

    const vendorAnalytics: VendorAnalytics[] = Array.from(vendorMap.entries()).map(([vendor, data]) => ({
      vendorName: vendor,
      toolCount: data.tools.length,
      avgRiskScore: data.tools.reduce((sum, t) => sum + t.riskScore, 0) / data.tools.length,
      totalUsage: data.totalUsage,
      complianceRate: data.tools.filter(t => t.complianceStatus === 'compliant').length / data.tools.length * 100,
      marketShare: totalUsageAllVendors > 0 ? (data.totalUsage / totalUsageAllVendors) * 100 : 0
    }));

    // Calculate adoption metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentTools = projectUsage.filter(tool => 
      new Date(tool.first_used) >= thirtyDaysAgo
    );

    const activeTools = projectUsage.filter(tool => 
      new Date(tool.last_used) >= thirtyDaysAgo
    );

    const topTools = projectUsage
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 5)
      .map(tool => ({
        name: tool.tool_name,
        usage: tool.usage_count || 0
      }));

    const adoptionMetrics: AdoptionMetrics = {
      totalTools: projectUsage.length,
      activeTools: activeTools.length,
      toolsAdded30d: recentTools.length,
      avgUsagePerTool: projectUsage.length > 0 
        ? projectUsage.reduce((sum, t) => sum + (t.usage_count || 0), 0) / projectUsage.length 
        : 0,
      topTools
    };

    return {
      toolRiskMatrix,
      vendorAnalytics,
      adoptionMetrics,
      loading,
      error
    };
  }, [projectUsage, toolUsageLogs, loading, error]);

  useEffect(() => {
    fetchData();
  }, [enterpriseId]);

  return {
    ...intelligenceData,
    refetch: fetchData
  };
};

function calculateRiskScore(riskLevel: string, complianceStatus: string): number {
  let score = 0;
  
  // Base risk score
  switch (riskLevel) {
    case 'low': score += 20; break;
    case 'medium': score += 50; break;
    case 'high': score += 80; break;
    default: score += 40; // unknown
  }
  
  // Compliance adjustment
  switch (complianceStatus) {
    case 'compliant': score -= 10; break;
    case 'non_compliant': score += 20; break;
    case 'partial': score += 10; break;
    default: score += 15; // unknown
  }
  
  return Math.max(0, Math.min(100, score));
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}