import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Building, Users, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { ClientLink } from '@/pages/agency/admin/ClientLinking';

interface ClientLinkTableProps {
  links: ClientLink[];
  loading: boolean;
  onStatusChange: (linkId: string, status: 'active' | 'suspended') => void;
  onRefresh: () => void;
}

export const ClientLinkTable: React.FC<ClientLinkTableProps> = ({
  links,
  loading,
  onStatusChange,
  onRefresh
}) => {
  const getStatusColor = (status: ClientLink['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: ClientLink['status']) => {
    switch (status) {
      case 'active': return <Activity className="h-3 w-3" />;
      case 'suspended': return <AlertTriangle className="h-3 w-3" />;
      default: return null;
    }
  };

  const stats = {
    total: links.length,
    active: links.filter(l => l.status === 'active').length,
    suspended: links.filter(l => l.status === 'suspended').length,
    totalSubmissions: links.reduce((sum, l) => sum + l.submissionCount, 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Links</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Links Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Links</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No client links found. Create your first link to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="font-medium">{link.agencyName}</div>
                      <div className="text-sm text-muted-foreground">{link.agencyId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{link.clientName}</div>
                      <div className="text-sm text-muted-foreground">{link.clientId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(link.status)}>
                        {getStatusIcon(link.status)}
                        <span className="ml-1">{link.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{link.submissionCount}</div>
                      <div className="text-sm text-muted-foreground">submissions</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(link.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {link.lastActivity ? (
                        format(new Date(link.lastActivity), 'MMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {link.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(link.id, 'suspended')}
                              className="text-red-600"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Suspend Link
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(link.id, 'active')}
                              className="text-green-600"
                            >
                              <Activity className="h-4 w-4 mr-2" />
                              Activate Link
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};