import { ScrollArea } from '@/components/ui/scroll-area';
import { useSandbox } from '@/hooks/useSandbox';
import { SandboxRun } from '@/types/sandbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useResponsiveSandbox } from '@/hooks/useResponsiveSandbox';
import { SimulationCard } from '../mobile/SimulationCard';

interface SimulationsListTabProps {
  workspaceId: string;
  selectedRunId: string | null;
  selectedProjectId: string | null;
  onRunSelect: (run: SandboxRun) => void;
  selectedFilters: string[];
}

export function SimulationsListTab({ 
  workspaceId, 
  selectedRunId,
  selectedProjectId,
  onRunSelect,
  selectedFilters 
}: SimulationsListTabProps) {
  const { runs } = useSandbox(workspaceId);
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile } = useResponsiveSandbox();

  // Apply filters
  let filteredRuns = selectedProjectId
    ? runs.filter(run => run.project_id === selectedProjectId)
    : runs;

  if (selectedFilters.length > 0) {
    filteredRuns = filteredRuns.filter(run => {
      const status = run.outputs_json?.validation_result === 'pass' ? 'Passed'
        : run.outputs_json?.validation_result === 'fail' ? 'Failed'
        : run.outputs_json?.risk_flags?.length > 0 ? 'Flagged'
        : 'Passed';
      
      return selectedFilters.includes(status);
    });
  }

  if (searchQuery) {
    filteredRuns = filteredRuns.filter(run => 
      run.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const showSearchAndFilters = runs.length >= 5;

  return (
    <ScrollArea className="h-full" role="region" aria-label="Simulations list">
      <div className="p-6 space-y-4 mobile-touch-spacing">
        {/* Search & Filter Bar (Progressive) */}
        {showSearchAndFilters && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search simulations by ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search simulations"
              />
            </div>
            <Button variant="outline" size="sm" aria-label="Filter simulations">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        )}

        {/* Mobile: Card Layout */}
        {isMobile ? (
          <div className="space-y-3" role="list" aria-label="Simulation cards">
            {filteredRuns.map((run) => (
              <SimulationCard
                key={run.id}
                run={run}
                selected={run.id === selectedRunId}
                onClick={() => onRunSelect(run)}
                isSample={run.metadata?.is_sample === true}
              />
            ))}
          </div>
        ) : (
          /* Desktop/Tablet: Table Layout */
          <>
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b" role="row">
              <div className="col-span-3" role="columnheader">Simulation ID</div>
              <div className="col-span-2" role="columnheader">Status</div>
              <div className="col-span-2" role="columnheader">Compliance</div>
              <div className="col-span-3" role="columnheader">Last Run</div>
              <div className="col-span-2 text-right" role="columnheader">Actions</div>
            </div>

            <div className="space-y-2" role="grid" aria-label="Simulations table">
              {filteredRuns.map((run) => (
                <SimulationRow
                  key={run.id}
                  run={run}
                  selected={run.id === selectedRunId}
                  onClick={() => onRunSelect(run)}
                  isSample={run.metadata?.is_sample === true}
                />
              ))}
            </div>
          </>
        )}

        {filteredRuns.length === 0 && (
          <div className="text-center py-12 text-muted-foreground" role="status">
            <p>No simulations match your filters</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Simulation Row Component
interface SimulationRowProps {
  run: SandboxRun;
  selected: boolean;
  onClick: () => void;
  isSample?: boolean;
}

function SimulationRow({ run, selected, onClick, isSample }: SimulationRowProps) {
  const complianceScore = run.outputs_json?.compliance_score || 0;
  const hasRiskFlags = run.outputs_json?.risk_flags?.length > 0;
  
  const statusBadge = run.outputs_json?.validation_result === 'pass' 
    ? { label: 'Passed', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' }
    : run.outputs_json?.validation_result === 'fail'
    ? { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' }
    : hasRiskFlags
    ? { label: 'Flagged', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' }
    : { label: 'Passed', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' };

  return (
    <div
      onClick={onClick}
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'grid grid-cols-12 gap-4 px-4 py-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selected && 'border-primary bg-accent'
      )}
    >
      <div className="col-span-3 font-mono text-sm flex items-center gap-2">
        <span>#{run.id.slice(0, 8)}</span>
        {isSample && (
          <Badge variant="outline" className="text-xs">
            Sample
          </Badge>
        )}
      </div>
      <div className="col-span-2 flex items-center">
        <Badge className={statusBadge.className} variant="secondary">
          {statusBadge.label}
        </Badge>
      </div>
      <div className="col-span-2 flex items-center">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{complianceScore}%</div>
          {hasRiskFlags && (
            <Badge variant="outline" className="text-xs">
              {run.outputs_json.risk_flags.length} flags
            </Badge>
          )}
        </div>
      </div>
      <div className="col-span-3 flex items-center text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
      </div>
      <div className="col-span-2 flex items-center justify-end">
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </div>
    </div>
  );
}
