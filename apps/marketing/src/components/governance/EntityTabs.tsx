import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowUpDown, 
  ExternalLink, 
  UserCheck, 
  MessageSquare, 
  Plus,
  Search,
  Filter,
  Building2,
  Users,
  Wrench,
  FileText,
  Globe
} from 'lucide-react';
import { GovernanceEntity } from '@/utils/governanceCalculations';
import { formatDistanceToNow } from 'date-fns';

interface EntityTabsProps {
  entities: GovernanceEntity[];
  activeTab: string;
  onEntityClick: (entity: GovernanceEntity) => void;
  onQuickAction: (entityId: string, action: string) => void;
}

export const EntityTabs: React.FC<EntityTabsProps> = ({
  entities,
  activeTab,
  onEntityClick,
  onQuickAction
}) => {
  const [sortBy, setSortBy] = useState<keyof GovernanceEntity>('ghi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: keyof GovernanceEntity) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const filteredEntities = entities
    .filter(entity => {
      if (activeTab !== 'all' && entity.type !== activeTab) return false;
      if (searchTerm && !entity.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * multiplier;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      return 0;
    });

  const SortableHeader: React.FC<{ column: keyof GovernanceEntity; children: React.ReactNode }> = ({ column, children }) => (
    <TableHead className="cursor-pointer hover:bg-accent/50" onClick={() => handleSort(column)}>
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'client': return <Building2 className="h-4 w-4" />;
      case 'partner': return <Users className="h-4 w-4" />;
      case 'tool': return <Wrench className="h-4 w-4" />;
      case 'policy': return <FileText className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getGHIBadgeVariant = (ghi: number) => {
    if (ghi >= 85) return 'default';
    if (ghi >= 70) return 'secondary';
    return 'destructive';
  };

  if (activeTab === 'clients') {
    const clientEntities = filteredEntities.filter(e => e.type === 'client');
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Client Governance</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader column="name">Client</SortableHeader>
                <SortableHeader column="ghi">GHI</SortableHeader>
                <SortableHeader column="compliance">Compliance</SortableHeader>
                <SortableHeader column="toolApproval">Tool Approval</SortableHeader>
                <SortableHeader column="auditCompleteness">Audit</SortableHeader>
                <SortableHeader column="openRisks">Open Risks</SortableHeader>
                <SortableHeader column="owner">Owner</SortableHeader>
                <SortableHeader column="lastUpdate">Last Update</SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientEntities.map(entity => (
                <TableRow key={entity.id} className="cursor-pointer hover:bg-accent/50">
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(entity.type)}
                      <span className="font-medium">{entity.name}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <Badge variant={getGHIBadgeVariant(entity.ghi)}>
                      {entity.ghi}%
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.compliance}%</TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.toolApproval}%</TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.auditCompleteness}%</TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <Badge variant={entity.openRisks > 3 ? 'destructive' : 'outline'}>
                      {entity.openRisks}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.owner}</TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>
                    {formatDistanceToNow(new Date(entity.lastUpdate), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onQuickAction(entity.id, 'open-workspace')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onQuickAction(entity.id, 'assign-remediation')}
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onQuickAction(entity.id, 'message-owner')}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'partners') {
    const partnerEntities = filteredEntities.filter(e => e.type === 'partner');
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Partner Governance</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader column="name">Partner</SortableHeader>
                <SortableHeader column="ghi">GHI</SortableHeader>
                <SortableHeader column="compliance">Compliance</SortableHeader>
                <SortableHeader column="toolApproval">Tool Approval</SortableHeader>
                <TableHead>Client Coverage</TableHead>
                <TableHead>Blocked Tools</TableHead>
                <SortableHeader column="owner">Owner</SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnerEntities.map(entity => (
                <TableRow key={entity.id} className="cursor-pointer hover:bg-accent/50">
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(entity.type)}
                      <span className="font-medium">{entity.name}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <Badge variant={getGHIBadgeVariant(entity.ghi)}>
                      {entity.ghi}%
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.compliance}%</TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.toolApproval}%</TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <Badge variant="outline">{Math.floor(Math.random() * 15) + 5}</Badge>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>
                    <Badge variant={Math.random() > 0.7 ? 'destructive' : 'outline'}>
                      {Math.floor(Math.random() * 8)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => onEntityClick(entity)}>{entity.owner}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onQuickAction(entity.id, 'open-workspace')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onQuickAction(entity.id, 'assign-remediation')}
                      >
                        <UserCheck className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'tools') {
    const toolCategories = [
      'Content Generation', 'Visual Design', 'Video Production', 'Audio Processing',
      'Marketing Analytics', 'Workflow Automation', 'Presentations', 'Data Analysis'
    ];

    return (
      <div className="space-y-6">
        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {toolCategories.map(category => (
            <Card key={category} className="cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-4 text-center">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium text-sm">{category}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(Math.random() * 200) + 50} tools
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.floor(Math.random() * 30) + 70}% approved
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tools Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Tools Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4" />
              <p>Tool registry details would be displayed here</p>
              <p className="text-sm">Including approval status, risk assessment, and usage analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default view for other tabs
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg capitalize">{activeTab} Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>This tab content is under development</p>
          <p className="text-sm">Would contain detailed {activeTab} management features</p>
        </div>
      </CardContent>
    </Card>
  );
};