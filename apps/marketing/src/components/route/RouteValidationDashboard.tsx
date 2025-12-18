import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, CheckCircle, XCircle, AlertTriangle, Clock, 
  Zap, Shield, Globe, BarChart3, Route, Component
} from 'lucide-react';
import { 
  validateAllRoutes, 
  testCriticalUserFlows, 
  ValidationSummary,
  RouteValidationResult 
} from '@/utils/routeValidator';
import { getAllManagedRoutes } from '@/config/routes.config';
import ComponentAuditDashboard from './ComponentAuditDashboard';

const RouteValidationDashboard: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationSummary | null>(null);
  const [userFlowResults, setUserFlowResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTab, setSelectedTab] = useState('overview');

  const runRouteValidation = async () => {
    setIsValidating(true);
    setProgress(0);

    try {
      const results = await validateAllRoutes({
        parallel: true,
        batchSize: 3,
        progressCallback: (completed, total) => {
          setProgress((completed / total) * 100);
        }
      });

      setValidationResults(results);
    } catch (error) {
      console.error('Route validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const runUserFlowTests = async () => {
    setIsValidating(true);
    try {
      const results = await testCriticalUserFlows();
      setUserFlowResults(results);
    } catch (error) {
      console.error('User flow testing failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const runFullValidation = async () => {
    await runRouteValidation();
    await runUserFlowTests();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'protection-error':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'passed':
        return 'secondary';
      case 'invalid':
      case 'failed':
        return 'destructive';
      case 'protection-error':
      case 'warning':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const routes = getAllManagedRoutes();
  const routeStats = {
    total: routes.length,
    public: routes.filter(r => r.category === 'landing' || r.category === 'product' || r.category === 'industry').length,
    protected: routes.filter(r => r.category === 'overview' || r.category === 'governance' || r.category === 'ecosystem').length,
    enterprise: routes.filter(r => r.category === 'overview' || r.category === 'governance' || r.category === 'ecosystem' || r.category === 'operations').length,
    agency: routes.filter(r => r.category === 'compliance' || r.category === 'tools' || r.category === 'workflow').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Route Validation Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive testing and validation for all application routes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runRouteValidation} disabled={isValidating}>
            <Route className="mr-2 h-4 w-4" />
            Validate Routes
          </Button>
          <Button onClick={runUserFlowTests} disabled={isValidating} variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Test User Flows
          </Button>
          <Button onClick={runFullValidation} disabled={isValidating} variant="secondary">
            <Play className="mr-2 h-4 w-4" />
            Run Full Validation
          </Button>
        </div>
      </div>

      {isValidating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Validation in progress...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routeStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Public</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{routeStats.public}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Protected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{routeStats.protected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Enterprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{routeStats.enterprise}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Agency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{routeStats.agency}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes">Route Details</TabsTrigger>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {validationResults && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Valid Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationResults.valid}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((validationResults.valid / validationResults.total) * 100)}% success rate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Invalid Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationResults.invalid}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                    Protection Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationResults.protectionErrors}</div>
                  <p className="text-xs text-muted-foreground">Security concerns</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-blue-500" />
                    Missing Components
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationResults.missingComponents}</div>
                  <p className="text-xs text-muted-foreground">Need implementation</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          {validationResults && (
            <Card>
              <CardHeader>
                <CardTitle>Route Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {validationResults.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium text-sm">{result.route}</div>
                          {result.message && (
                            <div className="text-xs text-muted-foreground">{result.message}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result.responseTime && (
                          <span className="text-xs text-muted-foreground">
                            {formatResponseTime(result.responseTime)}
                          </span>
                        )}
                        {result.statusCode && (
                          <span className="text-xs text-muted-foreground">
                            {result.statusCode}
                          </span>
                        )}
                        <Badge variant={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          {userFlowResults && (
            <div className="space-y-4">
              {userFlowResults.flows.map((flow: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{flow.name}</CardTitle>
                      <Badge variant={getStatusColor(flow.status)}>
                        {flow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {flow.routes.map((route: string, routeIndex: number) => (
                          <Badge
                            key={routeIndex}
                            variant={
                              flow.failedStep === route ? 'destructive' : 'outline'
                            }
                          >
                            {route}
                          </Badge>
                        ))}
                      </div>
                      {flow.message && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{flow.message}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <ComponentAuditDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {validationResults && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Average Response Time</div>
                      <div className="text-2xl font-bold">
                        {formatResponseTime(
                          validationResults.results
                            .filter(r => r.responseTime)
                            .reduce((sum, r) => sum + (r.responseTime || 0), 0) /
                          validationResults.results.filter(r => r.responseTime).length
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Fastest Route</div>
                      <div className="text-2xl font-bold">
                        {formatResponseTime(
                          Math.min(...validationResults.results
                            .filter(r => r.responseTime)
                            .map(r => r.responseTime || Infinity)
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Slowest Route</div>
                      <div className="text-2xl font-bold">
                        {formatResponseTime(
                          Math.max(...validationResults.results
                            .filter(r => r.responseTime)
                            .map(r => r.responseTime || 0)
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteValidationDashboard;