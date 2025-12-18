import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * ModelRegistryPanel - AI Model Asset Management
 * 
 * Center panel: Model list and registration form
 * Right panel: Validation results and dependencies
 */
export function ModelRegistryPanel() {
  return (
    <div className="h-full flex">
      {/* Center Panel: Model List */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">AI Model Registry</h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Register Model
          </Button>
        </div>

        {/* Model Cards */}
        <div className="space-y-3">
          {[
            { name: 'GPT-4', provider: 'OpenAI', risk: 'HIGH', status: 'active' },
            { name: 'Claude-3.5', provider: 'Anthropic', risk: 'MEDIUM', status: 'active' },
            { name: 'Llama-3-70B', provider: 'Meta', risk: 'LOW', status: 'deprecated' },
          ].map((model, idx) => (
            <Card key={idx} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">{model.provider}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    model.risk === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                    model.risk === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  }`}>
                    {model.risk}
                  </span>
                  <span className={`text-xs ${
                    model.status === 'active' ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {model.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="px-2 py-1 bg-muted rounded">PHI</span>
                <span className="px-2 py-1 bg-muted rounded">HIPAA</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel: Insights & Dependencies */}
      <div className="w-96 overflow-y-auto p-6 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-4">Validation & Dependencies</h3>
        
        <Card className="p-4 mb-4 border-l-4 border-l-destructive">
          <p className="text-sm font-semibold text-destructive mb-1">Metadata Incomplete</p>
          <p className="text-xs text-muted-foreground">2 models missing risk tier classification</p>
        </Card>

        <Card className="p-4 mb-4 border-l-4 border-l-warning">
          <p className="text-sm font-semibold text-warning mb-1">Policy Conflict</p>
          <p className="text-xs text-muted-foreground">GPT-4 tagged HIGH risk but using PUBLIC data sources</p>
        </Card>

        <div className="mt-6">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">DEPENDENCY MAP</h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">Connected Policies: 3</p>
              <p className="text-xs text-muted-foreground mt-1">Policy-001, Policy-042, Policy-103</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">Data Sources: 2</p>
              <p className="text-xs text-muted-foreground mt-1">Clinical Data Hub, Marketing CRM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
