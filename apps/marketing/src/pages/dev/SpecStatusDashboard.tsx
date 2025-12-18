import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppRegistry } from '@/hooks/useAppRegistry';
import SpecBadge from '@/components/ui/SpecBadge';
import { diffRoutes } from '@/lib/routeInventory';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const SpecStatusDashboard: React.FC = () => {
  const { data, stats, pages, apps } = useAppRegistry();

  const handleRunRouteDiff = () => {
    diffRoutes();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "YES": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PART": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "NO": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "YES": return "bg-green-100 text-green-800 border-green-200";
      case "PART": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "NO": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <StandardPageLayout
      title="Spec Status Dashboard"
      description="Track implementation progress across all applications and routes"
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Specs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Partial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.notImplemented}</div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Implementation Progress</span>
                <span>{stats.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Progress by Application */}
        <Card>
          <CardHeader>
            <CardTitle>Progress by Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byApp.map((app) => (
                <div key={app.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{app.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {app.implemented}/{app.total} specs completed
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(app.completionRate === 100 ? "YES" : app.completionRate > 0 ? "PART" : "NO")}>
                      {app.completionRate.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={app.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Route Development Utilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Development Utilities
              <Button onClick={handleRunRouteDiff} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Route Diff
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check browser console for route comparison results after running diff.
            </p>
          </CardContent>
        </Card>

        {/* Detailed Spec Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spec ID</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Wired</TableHead>
                  <TableHead>Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.specId}>
                    <TableCell className="font-mono text-sm">{page.specId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{page.appKey}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{page.route}</TableCell>
                    <TableCell className="text-sm">{page.component}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(page.status)}
                        <Badge variant="outline" className={getStatusColor(page.status)}>
                          {page.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.dataWired ? "default" : "secondary"}>
                        {page.dataWired ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SpecBadge id={page.specId} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Registry Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Registry Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium">Generated At</dt>
                <dd className="text-muted-foreground">{data.generated_at || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="font-medium">Total Applications</dt>
                <dd className="text-muted-foreground">{data.apps?.length || 0}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default SpecStatusDashboard;