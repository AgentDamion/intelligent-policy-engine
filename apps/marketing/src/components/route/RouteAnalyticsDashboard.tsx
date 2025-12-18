import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Users, Clock, MousePointer, 
  Route, Zap, AlertTriangle, Download 
} from 'lucide-react';
import { getAllManagedRoutes, routeCategories } from '@/config/routes.config';

interface RouteMetric {
  path: string;
  title: string;
  category: string;
  views: number;
  averageTime: number;
  bounceRate: number;
  conversionRate: number;
  errorRate: number;
  loadTime: number;
}

interface UserJourney {
  from: string;
  to: string;
  count: number;
  timestamp: number;
}

const RouteAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<RouteMetric[]>([]);
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = () => {
    // In a real app, this would fetch from your analytics service
    // For demo, we'll generate mock data based on stored route analytics
    const routes = getAllManagedRoutes();
    const storedAnalytics = JSON.parse(sessionStorage.getItem('routeAnalytics') || '[]');
    const storedJourneys = JSON.parse(sessionStorage.getItem('userJourney') || '[]');

    // Process route metrics
    const routeMetrics: RouteMetric[] = routes.map(route => {
      const routeViews = storedAnalytics.filter((view: any) => view.path === route.path);
      const views = routeViews.length;
      
      return {
        path: route.path,
        title: route.title,
        category: route.category,
        views,
        averageTime: Math.random() * 300 + 60, // 60-360 seconds
        bounceRate: Math.random() * 0.4 + 0.1, // 10-50%
        conversionRate: Math.random() * 0.15 + 0.02, // 2-17%
        errorRate: Math.random() * 0.05, // 0-5%
        loadTime: Math.random() * 2000 + 500 // 500-2500ms
      };
    }).sort((a, b) => b.views - a.views);

    // Process user journeys
    const journeyMap = new Map<string, number>();
    storedJourneys.forEach((journey: any) => {
      const key = `${journey.from}->${journey.to}`;
      journeyMap.set(key, (journeyMap.get(key) || 0) + 1);
    });

    const processedJourneys: UserJourney[] = Array.from(journeyMap.entries()).map(([key, count]) => {
      const [from, to] = key.split('->');
      return { from, to, count, timestamp: Date.now() };
    }).sort((a, b) => b.count - a.count);

    setAnalytics(routeMetrics);
    setJourneys(processedJourneys);
  };

  const getCategoryData = () => {
    const categoryMap = new Map<string, { views: number; routes: number }>();
    
    analytics.forEach(metric => {
      const current = categoryMap.get(metric.category) || { views: 0, routes: 0 };
      categoryMap.set(metric.category, {
        views: current.views + metric.views,
        routes: current.routes + 1
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      title: routeCategories[category as keyof typeof routeCategories]?.title || category,
      views: data.views,
      routes: data.routes
    }));
  };

  const getPerformanceData = () => {
    return analytics.slice(0, 10).map(metric => ({
      route: metric.title,
      loadTime: Math.round(metric.loadTime),
      errorRate: Math.round(metric.errorRate * 100),
      bounceRate: Math.round(metric.bounceRate * 100)
    }));
  };

  const exportAnalytics = () => {
    const data = {
      timeRange,
      exportDate: new Date().toISOString(),
      routeMetrics: analytics,
      userJourneys: journeys,
      categoryBreakdown: getCategoryData()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-analytics-${timeRange}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalViews = analytics.reduce((sum, metric) => sum + metric.views, 0);
  const averageLoadTime = analytics.reduce((sum, metric) => sum + metric.loadTime, 0) / analytics.length;
  const averageErrorRate = analytics.reduce((sum, metric) => sum + metric.errorRate, 0) / analytics.length;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Route Analytics</h2>
          <p className="text-muted-foreground">Performance insights and user journey analysis</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageLoadTime)}ms</div>
            <p className="text-xs text-muted-foreground">
              -8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageErrorRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              -2.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.filter(m => m.views > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              +3 new routes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes">Route Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="journeys">User Journeys</TabsTrigger>
          <TabsTrigger value="performance">Technical Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Routes by Traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.slice(0, 5).map((metric, index) => (
                    <div key={metric.path} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="font-medium">{metric.title}</div>
                        <div className="text-sm text-muted-foreground">{metric.path}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{metric.views} views</div>
                        <Badge variant={metric.errorRate > 0.02 ? "destructive" : "secondary"}>
                          {(metric.errorRate * 100).toFixed(1)}% errors
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${(value as number * 100).toFixed(1)}%`, 'Conversion Rate']} />
                    <Area 
                      type="monotone" 
                      dataKey="conversionRate" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ title, views }) => `${title}: ${views}`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="views"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getCategoryData().map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-3 rounded border">
                      <div>
                        <div className="font-medium">{category.title}</div>
                        <div className="text-sm text-muted-foreground">{category.routes} routes</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{category.views} views</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(category.views / category.routes)} avg/route
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular User Journeys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {journeys.slice(0, 10).map((journey, index) => (
                  <div key={`${journey.from}-${journey.to}-${index}`} className="flex items-center justify-between p-3 rounded border">
                    <div className="flex items-center space-x-2">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{journey.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm font-medium">{journey.to}</span>
                    </div>
                    <Badge variant="secondary">{journey.count} users</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="loadTime" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteAnalyticsDashboard;