import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, Users, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { GovernanceFilters as FilterType } from '@/hooks/useGovernanceData';

interface GovernanceFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export const GovernanceFilters: React.FC<GovernanceFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const updateFilter = (key: keyof FilterType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleRiskTier = (tier: 'high' | 'medium' | 'low') => {
    const newTiers = filters.riskTiers.includes(tier)
      ? filters.riskTiers.filter(t => t !== tier)
      : [...filters.riskTiers, tier];
    updateFilter('riskTiers', newTiers);
  };

  const toggleStatus = (status: 'approved' | 'pending' | 'blocked') => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilter('statuses', newStatuses);
  };

  const clearFilters = () => {
    onFiltersChange({
      timeRange: '30d',
      segment: 'all',
      riskTiers: [],
      statuses: [],
      search: '',
      region: undefined
    });
  };

  const hasActiveFilters = filters.search || filters.segment !== 'all' || 
    filters.riskTiers.length > 0 || filters.statuses.length > 0 || filters.region;

  return (
    <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-4">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Time Range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={filters.timeRange} onValueChange={(value: any) => updateFilter('timeRange', value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Segment Filter */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={filters.segment} onValueChange={(value: any) => updateFilter('segment', value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="client">By Client</SelectItem>
              <SelectItem value="partner">By Partner</SelectItem>
              <SelectItem value="tool">By Tool Category</SelectItem>
              <SelectItem value="policy">By Policy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2">
          <Select value={filters.region || 'all'} onValueChange={(value) => updateFilter('region', value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="EU">Europe</SelectItem>
              <SelectItem value="APAC">Asia Pacific</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients, partners, policies, tools..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Secondary Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Risk Tier Toggles */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Risk Tier:</span>
          <div className="flex gap-1">
            {(['high', 'medium', 'low'] as const).map(tier => (
              <Badge
                key={tier}
                variant={filters.riskTiers.includes(tier) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => toggleRiskTier(tier)}
              >
                {tier}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status Toggles */}
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Status:</span>
          <div className="flex gap-1">
            {(['approved', 'pending', 'blocked'] as const).map(status => (
              <Badge
                key={status}
                variant={filters.statuses.includes(status) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => toggleStatus(status)}
              >
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};