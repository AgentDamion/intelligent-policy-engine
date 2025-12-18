import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceProvider, usePerformance } from '@/components/performance/PerformanceProvider';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

const PerformanceContent: React.FC = () => {
  const { isMonitoring, startMonitoring, stopMonitoring, clearHistory, routeHistory } = usePerformance();

  const averageLoadTime = routeHistory.length > 0
    ? routeHistory.reduce((sum, entry) => sum + entry.loadTime, 0) / routeHistory.length
    : 0;

  const slowestRoute = routeHistory.length > 0
    ? routeHistory.reduce((slowest, current) => 
        current.loadTime > slowest.loadTime ? current : slowest
      )
    : null;

  const fastestRoute = routeHistory.length > 0
    ? routeHistory.reduce((fastest, current) => 
        current.loadTime < fastest.loadTime ? current : fastest
      )
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and optimize application performance</p>
        </div>
        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <Button onClick={stopMonitoring} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Stop Monitoring
            </Button>
          ) : (
            <Button onClick={startMonitoring}>
              <Activity className="h-4 w-4 mr-2" />
              Start Monitoring
            </Button>
          )}
          <Button onClick={clearHistory} variant="outline">
            Clear History
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Load Time</p>
                <p className="text-2xl font-bold">{Math.round(averageLoadTime)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Fastest Route</p>
                <p className="text-sm font-medium">
                  {fastestRoute ? `${fastestRoute.route} (${Math.round(fastestRoute.loadTime)}ms)` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Slowest Route</p>
                <p className="text-sm font-medium">
                  {slowestRoute ? `${slowestRoute.route} (${Math.round(slowestRoute.loadTime)}ms)` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Routes</p>
                <p className="text-2xl font-bold">{routeHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="history">Route History</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              {routeHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No performance data available. Navigate between pages to collect metrics.
                </p>
              ) : (
                <div className="space-y-2">
                  {routeHistory.slice(-20).reverse().map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{entry.route}</code>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.round(entry.loadTime)}ms</p>
                        {entry.strategy && (
                          <p className="text-xs text-muted-foreground">{entry.strategy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Route Preloading</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Critical routes are automatically preloaded. Consider enabling intelligent preloading for better user experience.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100">Lazy Loading</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Heavy components are lazy-loaded to reduce initial bundle size. Use the LazyWrapper component for new features.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">Performance Monitoring</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Enable real-time monitoring to identify performance bottlenecks and optimize accordingly.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const PerformancePage: React.FC = () => {
  return (
    <PerformanceProvider>
      <PerformanceContent />
    </PerformanceProvider>
  );
};

export default PerformancePage;