import { useState } from 'react';
import { FileText, Plus, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePolicyInstances } from '@/hooks/usePolicyInstances';
import type { PolicyInstanceStatus } from '@/types/policyInstance';

interface PolicyInstancesListProps {
  enterpriseId: string;
  workspaceId: string;
  onAdaptPolicy?: () => void;
}

const statusColors: Record<PolicyInstanceStatus, string> = {
  draft: 'bg-slate-500',
  in_review: 'bg-yellow-500',
  approved: 'bg-green-500',
  active: 'bg-blue-500',
  deprecated: 'bg-gray-500',
};

export function PolicyInstancesList({
  enterpriseId,
  workspaceId,
  onAdaptPolicy,
}: PolicyInstancesListProps) {
  const [selectedStatus, setSelectedStatus] = useState<PolicyInstanceStatus | 'all'>('all');
  
  const { instances, loading } = usePolicyInstances({
    enterpriseId,
    workspaceId,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  const statusCounts = {
    all: instances.length,
    draft: instances.filter(i => i.status === 'draft').length,
    in_review: instances.filter(i => i.status === 'in_review').length,
    approved: instances.filter(i => i.status === 'approved').length,
    active: instances.filter(i => i.status === 'active').length,
    deprecated: instances.filter(i => i.status === 'deprecated').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Policy Instances</h3>
        </div>
        {onAdaptPolicy && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onAdaptPolicy}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adapt
          </Button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'in_review', 'approved', 'active'] as const).map((status) => (
          <Badge
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedStatus(status)}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            <span className="ml-1 text-xs opacity-70">
              {statusCounts[status]}
            </span>
          </Badge>
        ))}
      </div>

      {/* Instances List */}
      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading instances...</div>
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No policy instances</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Adapt a template to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {instances.map((instance) => (
              <Card
                key={instance.id}
                className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {instance.use_case}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tool Version ID: {instance.tool_version_id.slice(0, 8)}...
                      </div>
                    </div>
                    <Badge
                      className={`${statusColors[instance.status]} text-white text-xs`}
                    >
                      {instance.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {instance.jurisdiction.slice(0, 2).map((jur) => (
                      <Badge key={jur} variant="outline" className="text-xs">
                        {jur}
                      </Badge>
                    ))}
                    {instance.jurisdiction.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{instance.jurisdiction.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(instance.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
