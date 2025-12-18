import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, 
  Code, Component, FileText, Zap
} from 'lucide-react';
import { 
  auditAllComponents, 
  generateImplementationPlan,
  ComponentAuditSummary,
  ComponentAuditResult 
} from '@/utils/componentAudit';

const ComponentAuditDashboard: React.FC = () => {
  const [auditResults, setAuditResults] = useState<ComponentAuditSummary | null>(null);
  const [implementationPlan, setImplementationPlan] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const runComponentAudit = async () => {
    setIsAuditing(true);
    try {
      const results = await auditAllComponents();
      setAuditResults(results);
      
      const plan = generateImplementationPlan(results);
      setImplementationPlan(plan);
    } catch (error) {
      console.error('Component audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  const getImplementationIcon = (implementation: string) => {
    switch (implementation) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'placeholder':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getImplementationColor = (implementation: string) => {
    switch (implementation) {
      case 'complete':
        return 'secondary';
      case 'partial':
        return 'default';
      case 'placeholder':
        return 'outline';
      case 'missing':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Component Audit Dashboard</h2>
          <p className="text-muted-foreground">
            Component implementation status and development planning
          </p>
        </div>
        <Button onClick={runComponentAudit} disabled={isAuditing}>
          <Component className="mr-2 h-4 w-4" />
          {isAuditing ? 'Auditing...' : 'Run Component Audit'}
        </Button>
      </div>

      {isAuditing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Auditing components...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {auditResults && (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditResults.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                  Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{auditResults.complete}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((auditResults.complete / auditResults.total) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <AlertTriangle className="mr-1 h-3 w-3 text-yellow-500" />
                  Partial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{auditResults.partial}</div>
                <p className="text-xs text-muted-foreground">Need completion</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Clock className="mr-1 h-3 w-3 text-orange-500" />
                  Placeholder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{auditResults.placeholder}</div>
                <p className="text-xs text-muted-foreground">Need replacement</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <XCircle className="mr-1 h-3 w-3 text-red-500" />
                  Missing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{auditResults.missing}</div>
                <p className="text-xs text-muted-foreground">Need creation</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Component Details</TabsTrigger>
              <TabsTrigger value="plan">Implementation Plan</TabsTrigger>
              <TabsTrigger value="missing">Missing Components</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress 
                        value={(auditResults.complete / auditResults.total) * 100} 
                        className="h-3" 
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{auditResults.complete} complete</span>
                        <span>{Math.round((auditResults.complete / auditResults.total) * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Action Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Need Implementation:</span>
                        <span className="font-medium">{auditResults.missing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Need Completion:</span>
                        <span className="font-medium">{auditResults.partial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Need Replacement:</span>
                        <span className="font-medium">{auditResults.placeholder}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Component Implementation Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditResults.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center space-x-3">
                          {getImplementationIcon(result.implementation)}
                          <div>
                            <div className="font-medium text-sm">{result.route}</div>
                            {result.componentPath && (
                              <div className="text-xs text-muted-foreground">{result.componentPath}</div>
                            )}
                            {result.issues.length > 0 && (
                              <div className="text-xs text-red-600">
                                {result.issues[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getImplementationColor(result.implementation)}>
                            {result.implementation}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plan" className="space-y-4">
              {implementationPlan && (
                <div className="space-y-4">
                  {implementationPlan.phases.map((phase: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{phase.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getPriorityColor(phase.priority)}>
                              {phase.priority} priority
                            </Badge>
                            <Badge variant="outline">
                              {phase.estimatedEffort}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {phase.description}
                        </p>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">
                            Routes ({phase.routes.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {phase.routes.map((route: string, routeIndex: number) => (
                              <Badge key={routeIndex} variant="outline" className="text-xs">
                                {route}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="missing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Missing Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {auditResults.missingComponents.map((route, index) => (
                        <div key={index} className="text-sm font-mono bg-muted p-1 rounded">
                          {route}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-orange-500" />
                      Placeholder Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {auditResults.placeholderComponents.map((route, index) => (
                        <div key={index} className="text-sm font-mono bg-muted p-1 rounded">
                          {route}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ComponentAuditDashboard;