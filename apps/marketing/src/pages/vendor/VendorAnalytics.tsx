import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, Users, DollarSign, Star } from 'lucide-react';

const VendorAnalytics = () => {
  // Mock data for demonstration
  const metrics = {
    totalViews: 12450,
    viewsChange: 15.3,
    totalUsers: 892,
    usersChange: -2.1,
    revenue: 8750,
    revenueChange: 23.8,
    avgRating: 4.6,
    ratingChange: 0.2
  };

  const toolPerformance = [
    {
      name: "AI Content Generator",
      views: 8200,
      users: 620,
      revenue: 5400,
      rating: 4.8
    },
    {
      name: "Workflow Optimizer", 
      views: 3100,
      users: 185,
      revenue: 2100,
      rating: 4.6
    },
    {
      name: "Smart Analytics Tool",
      views: 1150,
      users: 87,
      revenue: 1250,
      rating: 4.3
    }
  ];

  const MetricCard = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prefix}{value.toLocaleString()}{suffix}</div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {change > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span>vs last month</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your tools' performance and revenue</p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Views"
          value={metrics.totalViews}
          change={metrics.viewsChange}
          icon={Eye}
        />
        <MetricCard
          title="Active Users"
          value={metrics.totalUsers}
          change={metrics.usersChange}
          icon={Users}
        />
        <MetricCard
          title="Revenue"
          value={metrics.revenue}
          change={metrics.revenueChange}
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard
          title="Avg Rating"
          value={metrics.avgRating}
          change={metrics.ratingChange}
          icon={Star}
          suffix="/5.0"
        />
      </div>

      {/* Tool Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolPerformance.map((tool, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-1">
                  <h4 className="font-medium">{tool.name}</h4>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{tool.views.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{tool.users.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">${tool.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold">{tool.rating}</p>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;