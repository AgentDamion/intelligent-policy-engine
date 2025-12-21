import React from 'react';
import { ArrowRight, AlertTriangle, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const workflows = [
  {
    id: 'hcp-campaign',
    title: 'HCP Campaign Development',
    description: 'Full lifecycle from client brief to market deployment for healthcare professional campaigns',
    audience: 'Agency',
    riskLevel: 'High',
    phases: 6,
    aiHotspots: 12,
    critical: 2,
    featured: true
  },
  {
    id: 'patient-education',
    title: 'Patient Education Materials',
    description: 'DTC content development with simplified MLR pathway',
    audience: 'Agency',
    riskLevel: 'Medium',
    phases: 5,
    aiHotspots: 10,
    critical: 1,
    featured: true
  },
  {
    id: 'agency-oversight',
    title: 'Agency Oversight Framework',
    description: 'Monitor partner AI usage across your agency roster',
    audience: 'Enterprise',
    riskLevel: 'Foundation',
    phases: 4,
    aiHotspots: 6,
    critical: 0,
    featured: true
  }
];

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
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

export const WorkflowTemplatesPreview = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-foreground mb-4 font-solution">
          We've mapped where AI risk lives in regulated workflows.
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          See the governance seams before they bite you.
        </p>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {workflows.map((workflow) => (
            <div 
              key={workflow.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={getAudienceColor(workflow.audience)}>
                  {workflow.audience === 'Agency' && <Layers className="w-3 h-3 mr-1" />}
                  {workflow.audience}
                </Badge>
                <Badge variant="outline" className={getRiskColor(workflow.riskLevel)}>
                  {workflow.riskLevel}
                </Badge>
                {workflow.featured && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Featured
                  </Badge>
                )}
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {workflow.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {workflow.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {workflow.phases} phases
                </span>
                <span>
                  ⚡ {workflow.aiHotspots} AI hotspots
                </span>
                {workflow.critical > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    {workflow.critical} critical
                  </span>
                )}
              </div>

              <Link 
                to="/workflows"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
              >
                View Template <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/workflows">
              Browse all workflows <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Don't see your workflow? <Link to="/workflows" className="text-primary hover:underline">Request a custom template</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default WorkflowTemplatesPreview;



