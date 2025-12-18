import { useState, useEffect } from 'react';

export interface ToolStatus {
  name: string;
  status: 'approved' | 'pending' | 'not_allowed';
  riskLevel: 'high' | 'medium' | 'low';
  compliance: string[];
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  tools: ToolStatus[];
  expanded: boolean;
}

export const useClientToolCategories = (clientId?: string) => {
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    
    // Sample data - in real implementation would fetch from Supabase
    const sampleCategories: ToolCategory[] = [
      {
        id: 'content-creation',
        name: 'Content Creation & Copywriting',
        description: 'AI tools for generating and editing text content',
        expanded: false,
        tools: [
          { name: 'ChatGPT', status: 'approved', riskLevel: 'medium', compliance: ['GDPR', 'SOC2'] },
          { name: 'Jasper AI', status: 'pending', riskLevel: 'low', compliance: ['GDPR'] },
          { name: 'Copy.ai', status: 'not_allowed', riskLevel: 'high', compliance: [] }
        ]
      },
      {
        id: 'visual-design',
        name: 'Visual Design & Creative',
        description: 'Tools for creating and editing visual content',
        expanded: false,
        tools: [
          { name: 'Canva', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2', 'ISO27001'] },
          { name: 'Midjourney', status: 'not_allowed', riskLevel: 'high', compliance: [] },
          { name: 'DALL-E', status: 'pending', riskLevel: 'medium', compliance: ['SOC2'] }
        ]
      },
      {
        id: 'video-production',
        name: 'Video Production',
        description: 'AI-powered video creation and editing tools',
        expanded: false,
        tools: [
          { name: 'Runway ML', status: 'pending', riskLevel: 'high', compliance: [] },
          { name: 'Synthesia', status: 'approved', riskLevel: 'medium', compliance: ['GDPR', 'SOC2'] },
          { name: 'Luma AI', status: 'not_allowed', riskLevel: 'high', compliance: [] }
        ]
      },
      {
        id: 'audio-production',
        name: 'Audio Production',
        description: 'Voice synthesis and audio editing tools',
        expanded: false,
        tools: [
          { name: 'ElevenLabs', status: 'pending', riskLevel: 'medium', compliance: ['GDPR'] },
          { name: 'Murf AI', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2'] }
        ]
      },
      {
        id: 'marketing-analytics',
        name: 'Marketing Analytics',
        description: 'AI-driven analytics and insights tools',
        expanded: false,
        tools: [
          { name: 'Google Analytics Intelligence', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2'] },
          { name: 'Adobe Analytics AI', status: 'approved', riskLevel: 'medium', compliance: ['GDPR', 'SOC2', 'ISO27001'] }
        ]
      },
      {
        id: 'workflow-automation',
        name: 'Workflow Automation',
        description: 'Process automation and workflow tools',
        expanded: false,
        tools: [
          { name: 'Zapier AI', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2'] },
          { name: 'Microsoft Power Automate', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2', 'ISO27001'] }
        ]
      },
      {
        id: 'presentations',
        name: 'Presentations',
        description: 'AI-powered presentation creation tools',
        expanded: false,
        tools: [
          { name: 'Gamma', status: 'pending', riskLevel: 'medium', compliance: ['GDPR'] },
          { name: 'Beautiful.ai', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2'] }
        ]
      },
      {
        id: 'specialized-creative',
        name: 'Specialized Creative',
        description: 'Niche creative AI tools and platforms',
        expanded: false,
        tools: [
          { name: 'Figma AI', status: 'approved', riskLevel: 'low', compliance: ['GDPR', 'SOC2'] },
          { name: 'Adobe Firefly', status: 'approved', riskLevel: 'medium', compliance: ['GDPR', 'SOC2', 'ISO27001'] }
        ]
      },
      {
        id: 'emerging-tech',
        name: 'Emerging Tech',
        description: 'Cutting-edge AI tools and experimental platforms',
        expanded: false,
        tools: [
          { name: 'Claude 3', status: 'pending', riskLevel: 'medium', compliance: ['SOC2'] },
          { name: 'Perplexity AI', status: 'not_allowed', riskLevel: 'high', compliance: [] }
        ]
      }
    ];

    setCategories(sampleCategories);
    setLoading(false);
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  useEffect(() => {
    if (clientId) {
      fetchCategories();
    }
  }, [clientId]);

  return {
    categories,
    loading,
    toggleCategory,
    refetch: fetchCategories
  };
};