import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ClientPerformanceData } from '@/hooks/useAgencyPerformance';

interface ClientPerformanceTableProps {
  clients: ClientPerformanceData[];
}

type SortField = 'name' | 'onTimeRate' | 'approvalRate' | 'avgCycleTime' | 'totalSubmissions';
type SortDirection = 'asc' | 'desc';

export const ClientPerformanceTable: React.FC<ClientPerformanceTableProps> = ({ clients }) => {
  const [sortField, setSortField] = useState<SortField>('onTimeRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getPerformanceBadge = (value: number, type: 'rate' | 'time') => {
    if (type === 'rate') {
      if (value >= 90) return { variant: 'default' as const, color: 'text-brand-green' };
      if (value >= 70) return { variant: 'secondary' as const, color: 'text-brand-orange' };
      return { variant: 'destructive' as const, color: 'text-destructive' };
    } else {
      if (value <= 5) return { variant: 'default' as const, color: 'text-brand-green' };
      if (value <= 10) return { variant: 'secondary' as const, color: 'text-brand-orange' };
      return { variant: 'destructive' as const, color: 'text-destructive' };
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  <SortButton field="name">Client</SortButton>
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  <SortButton field="onTimeRate">On-Time Rate</SortButton>
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  <SortButton field="approvalRate">Approval Rate</SortButton>
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  <SortButton field="avgCycleTime">Avg Cycle Time</SortButton>
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  <SortButton field="totalSubmissions">Submissions</SortButton>
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client) => {
                const onTimeBadge = getPerformanceBadge(client.onTimeRate, 'rate');
                const approvalBadge = getPerformanceBadge(client.approvalRate, 'rate');
                const cycleTimeBadge = getPerformanceBadge(client.avgCycleTime, 'time');

                return (
                  <tr key={client.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="font-medium">{client.name}</div>
                    </td>
                    <td className="py-4">
                      <span className={onTimeBadge.color}>{client.onTimeRate}%</span>
                    </td>
                    <td className="py-4">
                      <span className={approvalBadge.color}>{client.approvalRate}%</span>
                    </td>
                    <td className="py-4">
                      <span className={cycleTimeBadge.color}>{client.avgCycleTime} days</span>
                    </td>
                    <td className="py-4">
                      <span className="text-muted-foreground">{client.totalSubmissions}</span>
                    </td>
                    <td className="py-4">
                      <Badge variant={getRiskBadgeVariant(client.riskLevel)}>
                        {client.riskLevel.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};