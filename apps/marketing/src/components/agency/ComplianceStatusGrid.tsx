import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RotateCcw
} from 'lucide-react';
import { ClientComplianceCard } from './ClientComplianceCard';
import type { ClientCompliance } from '@/hooks/useClientComplianceData';

interface ComplianceStatusGridProps {
  clients: ClientCompliance[];
  loading: boolean;
  statusCounts: {
    compliant: number;
    warning: number;
    critical: number;
    total: number;
  };
  onRefresh: () => void;
  onViewDetails?: (clientId: string) => void;
}

type StatusFilter = 'all' | 'compliant' | 'warning' | 'critical';

export const ComplianceStatusGrid: React.FC<ComplianceStatusGridProps> = ({
  clients,
  loading,
  statusCounts,
  onRefresh,
  onViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getFilterButtonVariant = (filter: StatusFilter) => {
    return statusFilter === filter ? 'default' : 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="h-10 bg-muted animate-pulse rounded-md flex-1 max-w-md" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
        
        {/* Loading skeleton for cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          className="bg-card p-4 rounded-lg border"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{statusCounts.compliant}</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card p-4 rounded-lg border"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.warning}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card p-4 rounded-lg border"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{statusCounts.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card p-4 rounded-lg border"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <div className="text-sm text-muted-foreground">Total Clients</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={getFilterButtonVariant('all')}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={getFilterButtonVariant('compliant')}
            size="sm"
            onClick={() => setStatusFilter('compliant')}
            className="gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Compliant
          </Button>
          <Button
            variant={getFilterButtonVariant('warning')}
            size="sm"
            onClick={() => setStatusFilter('warning')}
            className="gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Button>
          <Button
            variant={getFilterButtonVariant('critical')}
            size="sm"
            onClick={() => setStatusFilter('critical')}
            className="gap-1"
          >
            <XCircle className="h-3 w-3" />
            Critical
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredClients.length} of {clients.length} clients
        </div>
        {searchTerm && (
          <Badge variant="secondary" className="gap-1">
            <Search className="h-3 w-3" />
            "{searchTerm}"
          </Badge>
        )}
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ClientComplianceCard 
                client={client} 
                onViewDetails={onViewDetails}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No clients found</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? `No clients match "${searchTerm}" with ${statusFilter === 'all' ? 'any status' : statusFilter + ' status'}`
              : `No clients with ${statusFilter} status`
            }
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  );
};