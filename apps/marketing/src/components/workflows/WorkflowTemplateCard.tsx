import React from 'react';
import { ArrowRight, AlertTriangle, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WorkflowTemplate } from '@/data/workflowTemplates';

interface WorkflowTemplateCardProps {
  workflow: WorkflowTemplate;
  onViewTemplate?: (id: string) => void;
}

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getAudienceColor = (audience: string) => {
  switch (audience.toLowerCase()) {
    case 'agency':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'enterprise':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const WorkflowTemplateCard = ({
  workflow,
  onViewTemplate
}: WorkflowTemplateCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/30">
      {/* Tags Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="outline" className={getAudienceColor(workflow.audience)}>
          {workflow.audience === 'agency' && <Layers className="w-3 h-3 mr-1" />}
          {workflow.audience.charAt(0).toUpperCase() + workflow.audience.slice(1)}
        </Badge>
        <Badge variant="outline" className={getRiskColor(workflow.riskLevel)}>
          {workflow.riskLevel.charAt(0).toUpperCase() + workflow.riskLevel.slice(1)}
        </Badge>
        {workflow.featured && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Featured
          </Badge>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {workflow.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {workflow.description}
      </p>

      {/* Metrics */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {workflow.phases} phases
        </span>
        <span>
          ⚡ {workflow.aiHotspots} AI hotspots
        </span>
        {workflow.criticalItems > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            {workflow.criticalItems} critical
          </span>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onViewTemplate?.(workflow.id)}
        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
      >
        View Template <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default WorkflowTemplateCard;










