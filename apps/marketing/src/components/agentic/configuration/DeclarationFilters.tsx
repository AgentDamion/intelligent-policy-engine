import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeclarationFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export function DeclarationFilters({ filters, onFiltersChange }: DeclarationFiltersProps) {
  const { data: stats } = useQuery({
    queryKey: ['declaration-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_declarations')
        .select('validation_status, aggregated_risk_tier')
        .limit(1000);
      
      if (error) throw error;
      
      const compliant = data.filter(d => d.validation_status === 'compliant').length;
      const pending = data.filter(d => d.validation_status === 'pending').length;
      const violations = data.filter(d => d.validation_status === 'non_compliant').length;
      
      return { total: data.length, compliant, pending, violations };
    },
  });

  const resetFilters = () => {
    onFiltersChange({
      partnerId: '',
      projectId: '',
      status: '',
      dateRange: { from: '', to: '' },
      fileType: '',
      riskTier: '',
    });
  };

  return (
    <Card className="p-4 space-y-4 h-full overflow-y-auto">
      <div>
        <h3 className="font-semibold mb-4">Filters</h3>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Compliant</p>
              <p className="text-lg font-bold text-green-600">{stats.compliant}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Violations</p>
              <p className="text-lg font-bold text-red-600">{stats.violations}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="non_compliant">Non-Compliant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Risk Tier</Label>
          <Select
            value={filters.riskTier}
            onValueChange={(value) => onFiltersChange({ ...filters, riskTier: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">File Type</Label>
          <Input
            value={filters.fileType}
            onChange={(e) => onFiltersChange({ ...filters, fileType: e.target.value })}
            placeholder="e.g., video/mp4"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Date From</Label>
          <Input
            type="date"
            value={filters.dateRange.from}
            onChange={(e) => onFiltersChange({
              ...filters,
              dateRange: { ...filters.dateRange, from: e.target.value }
            })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Date To</Label>
          <Input
            type="date"
            value={filters.dateRange.to}
            onChange={(e) => onFiltersChange({
              ...filters,
              dateRange: { ...filters.dateRange, to: e.target.value }
            })}
            className="mt-1"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="w-full"
        >
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}
