import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * DataSourcePanel - Data Source Registry Management
 */
export function DataSourcePanel() {
  return (
    <div className="h-full flex">
      {/* Center Panel: Data Source List */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Data Source Registry</h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Clinical Data Hub', type: 'database', sensitivity: 'PHI', status: 'active' },
            { name: 'Marketing CRM', type: 'api', sensitivity: 'PII', status: 'active' },
            { name: 'Public Research DB', type: 'data_warehouse', sensitivity: 'PUBLIC', status: 'active' },
          ].map((source, idx) => (
            <Card key={idx} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{source.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{source.type.replace('_', ' ')}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  source.sensitivity === 'PHI' ? 'bg-destructive/10 text-destructive' :
                  source.sensitivity === 'PII' ? 'bg-warning/10 text-warning' :
                  'bg-success/10 text-success'
                }`}>
                  {source.sensitivity}
                </span>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="px-2 py-1 bg-muted rounded">HIPAA</span>
                <span className="px-2 py-1 bg-muted rounded">FDA</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel: Validation Results */}
      <div className="w-96 overflow-y-auto p-6 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-4">Compliance Validation</h3>
        
        <Card className="p-4 mb-4 border-l-4 border-l-success">
          <p className="text-sm font-semibold text-success mb-1">All Clear</p>
          <p className="text-xs text-muted-foreground">All data sources properly tagged with sensitivity and jurisdiction</p>
        </Card>

        <div className="mt-6">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">CONNECTED MODELS</h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-background rounded border border-border">
              <p className="font-medium text-foreground">Clinical Data Hub</p>
              <p className="text-xs text-muted-foreground mt-1">→ Used by GPT-4, Claude-3.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
