import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RunFiltersProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

export function RunFilters({ selectedFilters, onFilterChange }: RunFiltersProps) {
  const statuses = [
    { label: 'All', count: 35 },
    { label: 'Passed', count: 24 },
    { label: 'Flagged', count: 8 },
    { label: 'Failed', count: 3 },
  ];

  const toggleFilter = (label: string) => {
    if (label === 'All') {
      onFilterChange([]);
      return;
    }

    const isSelected = selectedFilters.includes(label);
    if (isSelected) {
      onFilterChange(selectedFilters.filter(f => f !== label));
    } else {
      onFilterChange([...selectedFilters, label]);
    }
  };

  const isAllSelected = selectedFilters.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Filter className="h-3 w-3" />
          Filters
          {selectedFilters.length > 0 && (
            <span className="text-xs">({selectedFilters.length})</span>
          )}
        </h3>
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs"
            onClick={() => onFilterChange([])}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <Card className="p-3">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
            <div className="flex flex-wrap gap-1">
              {statuses.map((status) => {
                const isSelected = status.label === 'All' 
                  ? isAllSelected 
                  : selectedFilters.includes(status.label);
                
                return (
                  <Badge
                    key={status.label}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    )}
                    onClick={() => toggleFilter(status.label)}
                  >
                    {status.label} ({status.count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
