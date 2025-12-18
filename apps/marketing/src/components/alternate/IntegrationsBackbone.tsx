import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  Code, 
  BarChart3,
  FileText,
  Users,
  Cloud,
  Lock,
  Workflow,
  Settings
} from 'lucide-react';

const integrationTools = [
  { name: "OpenAI", icon: Brain, category: "AI" },
  { name: "Anthropic", icon: Brain, category: "AI" },
  { name: "Google AI", icon: Database, category: "AI" },
  { name: "AWS", icon: Cloud, category: "Cloud" },
  { name: "Azure", icon: Shield, category: "Cloud" },
  { name: "Salesforce", icon: Users, category: "CRM" },
  { name: "HubSpot", icon: BarChart3, category: "Marketing" },
  { name: "Slack", icon: Users, category: "Communication" },
  { name: "Notion", icon: FileText, category: "Productivity" },
  { name: "GitHub", icon: Code, category: "Development" },
  { name: "Zapier", icon: Workflow, category: "Automation" },
  { name: "Custom APIs", icon: Settings, category: "Integration" },
];

const IntegrationsBackbone = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            One Governance Backbone Across{' '}
            <span className="text-brand-teal">500+ Tools</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Connect your entire AI ecosystem under unified compliance governance. From development to deployment, every tool follows the same standards.
          </p>
        </div>

        <div className="relative">
          {/* Integration Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {integrationTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-card border border-border rounded-lg p-4 hover-scale text-center"
                >
                  <div className="w-8 h-8 mx-auto mb-2 text-primary">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <div className="text-xs font-medium text-foreground truncate">
                    {tool.name}
                  </div>
                  <Badge 
                    variant="outline" 
                    className="absolute -top-2 -right-2 text-xs px-1 py-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {tool.category}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Central Hub Indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-brand-teal/10 border border-brand-teal/20 rounded-full px-6 py-3">
              <div className="w-3 h-3 rounded-full bg-brand-teal animate-pulse"></div>
              <span className="text-sm font-medium text-brand-teal">
                Unified Compliance Backbone Active
              </span>
            </div>
          </div>

          {/* Connection Lines Visualization */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path 
                    d="M 40 0 L 0 0 0 40" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="1"
                    opacity="0.1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsBackbone;