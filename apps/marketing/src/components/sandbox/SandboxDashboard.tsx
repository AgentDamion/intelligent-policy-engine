import { useState } from 'react';
import { Plus, Play, FileCheck, Download, Activity, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSandbox } from '@/hooks/useSandbox';
import { useSandboxAgents } from '@/hooks/useSandboxAgents';
import { CreateSimulationDialog } from './CreateSimulationDialog';
import { SandboxRunCard } from './SandboxRunCard';
import { SandboxAgentActivity } from './SandboxAgentActivity';
import type { SandboxRun } from '@/types/sandbox';

interface SandboxDashboardProps {
  workspaceId: string;
  enterpriseId: string;
}

export function SandboxDashboard({ workspaceId, enterpriseId }: SandboxDashboardProps) {
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [selectedRun, setSelectedRun] = useState<SandboxRun | null>(null);
  const { runs, loading, runSimulation, refreshRuns } = useSandbox(workspaceId);
  const { agentActivity, isProcessing } = useSandboxAgents();

  const stats = {
    total: runs.length,
    completed: runs.filter((r) => r.status === 'completed').length,
    pending: runs.filter((r) => r.status === 'pending_approval').length,
    approved: runs.filter((r) => r.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent Simulations</h2>
          <p className="text-muted-foreground mt-1">
            View and manage policy sandbox test runs
          </p>
        </div>
        <Button onClick={() => setShowRunDialog(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Simulation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All sandbox simulations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully executed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for export</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Activity */}
      {(agentActivity.length > 0 || isProcessing) && (
        <SandboxAgentActivity 
          activities={agentActivity}
          isProcessing={isProcessing}
        />
      )}

      {/* Runs List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Simulations</CardTitle>
          <CardDescription>View and manage policy sandbox runs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && runs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading sandbox runs...</div>
            </div>
          ) : runs.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                  <FlaskConical className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No simulations yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    The Policy Sandbox allows you to test policies in a safe environment before deployment.
                    Start by selecting a policy and configuring a test scenario.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowRunDialog(true)}>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Run First Simulation
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://docs.aicomply.io/sandbox" target="_blank" rel="noopener noreferrer">
                      View Documentation
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <SandboxRunCard
                  key={run.id}
                  run={run}
                  onClick={() => setSelectedRun(run)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Simulation Dialog */}
      <CreateSimulationDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        workspaceId={workspaceId}
        enterpriseId={enterpriseId}
        onRunCreated={() => {
          setShowRunDialog(false);
          refreshRuns();
        }}
      />
    </div>
  );
}
