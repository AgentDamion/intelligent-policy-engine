import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, TrendingUp, Eye, Plus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const VendorDashboard = () => {
  // Mock data - replace with real data from hooks
  const stats = {
    totalTools: 5,
    activePromotions: 2,
    totalViews: 1250,
    monthlyRevenue: 2400
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your AI tools and marketplace presence
          </p>
        </div>
        <Button asChild>
          <Link to="/vendor/tools/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Tool
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tools
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTools}</div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Promotions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePromotions}</div>
            <p className="text-xs text-muted-foreground">
              2 pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">New tool request approved</span>
              <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Promotion request pending</span>
              <span className="text-xs text-muted-foreground ml-auto">1d ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Analytics report generated</span>
              <span className="text-xs text-muted-foreground ml-auto">3d ago</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/vendor/tools/new">
                <Plus className="h-4 w-4 mr-2" />
                Submit New Tool
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/vendor/promotions">
                <TrendingUp className="h-4 w-4 mr-2" />
                Request Promotion
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/vendor/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;