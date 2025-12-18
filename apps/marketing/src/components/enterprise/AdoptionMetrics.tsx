import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Zap, Plus, BarChart3 } from 'lucide-react';
import { AdoptionMetrics as AdoptionMetricsType } from '@/hooks/useToolIntelligence';
import { MetricCard } from '@/components/common/MetricCard';

interface AdoptionMetricsProps {
  data: AdoptionMetricsType;
  loading?: boolean;
}

export const AdoptionMetrics: React.FC<AdoptionMetricsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tools"
          value={data.totalTools.toString()}
          icon={<BarChart3 className="h-4 w-4" />}
          description="Tools monitored across all projects"
        />
        
        <MetricCard
          title="Active Tools"
          value={data.activeTools.toString()}
          icon={<Zap className="h-4 w-4" />}
          description="Used in the last 30 days"
          change={{
            value: data.activeTools > 0 ? Math.round((data.activeTools / data.totalTools) * 100) : 0,
            type: 'increase',
            period: 'activity rate'
          }}
        />
        
        <MetricCard
          title="New Tools"
          value={data.toolsAdded30d.toString()}
          icon={<Plus className="h-4 w-4" />}
          description="Added in the last 30 days"
          change={{
            value: data.toolsAdded30d,
            type: data.toolsAdded30d > 0 ? 'increase' : 'neutral',
            period: '30 days'
          }}
        />
        
        <MetricCard
          title="Avg Usage"
          value={Math.round(data.avgUsagePerTool).toString()}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Average uses per tool"
        />
      </div>

      {/* Top Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Tools
          </CardTitle>
          <CardDescription>
            Most frequently used AI tools in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topTools.map((tool, index) => {
              const maxUsage = data.topTools[0]?.usage || 1;
              const percentage = (tool.usage / maxUsage) * 100;
              
              return (
                <div key={tool.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{tool.usage}</span>
                      <span className="text-sm text-muted-foreground ml-1">uses</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {data.topTools.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No usage data available. Start using AI tools to see adoption patterns.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};