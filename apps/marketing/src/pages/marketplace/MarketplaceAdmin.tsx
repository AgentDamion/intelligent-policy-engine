import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Filter
} from 'lucide-react';
import AdminPromotionManagement from '@/components/marketplace/AdminPromotionManagement';

const MarketplaceAdmin = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const adminStats = [
    { title: 'Pending Reviews', value: '12', icon: Clock, color: 'text-yellow-600' },
    { title: 'Verified Tools', value: '148', icon: CheckCircle, color: 'text-green-600' },
    { title: 'Active Vendors', value: '52', icon: Users, color: 'text-blue-600' },
    { title: 'Monthly Requests', value: '1,247', icon: TrendingUp, color: 'text-purple-600' }
  ];

  const pendingTools = [
    {
      id: '1',
      name: 'HealthAI Scanner',
      vendor: 'MedTech Solutions',
      category: 'Healthcare AI',
      submittedDate: '2024-01-15',
      complianceClaims: ['HIPAA', 'FDA'],
      riskLevel: 'medium'
    },
    {
      id: '2',
      name: 'FinanceBot Pro',
      vendor: 'DataFlow Systems', 
      category: 'Financial Analytics',
      submittedDate: '2024-01-14',
      complianceClaims: ['SOX', 'PCI DSS'],
      riskLevel: 'low'
    },
    {
      id: '3',
      name: 'LegalAssist AI',
      vendor: 'LawTech Inc',
      category: 'Legal Tech',
      submittedDate: '2024-01-13',
      complianceClaims: ['GDPR'],
      riskLevel: 'high'
    }
  ];

  const recentActivity = [
    { action: 'Tool Approved', tool: 'MedAI Diagnostics', vendor: 'HealthTech Solutions', time: '2 hours ago' },
    { action: 'Tool Rejected', tool: 'DataMiner Pro', vendor: 'Analytics Corp', time: '4 hours ago' },
    { action: 'New Submission', tool: 'ChatBot Enterprise', vendor: 'AI Solutions', time: '6 hours ago' },
    { action: 'Vendor Verified', tool: '', vendor: 'SecureAI Systems', time: '1 day ago' }
  ];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = (toolId: string) => {
    console.log('Approving tool:', toolId);
    // Handle approval logic
  };

  const handleReject = (toolId: string) => {
    console.log('Rejecting tool:', toolId);
    // Handle rejection logic
  };

  return (
    <StandardPageLayout
      title="Marketplace Administration"
      subtitle="Manage tool submissions, vendors, and marketplace operations"
    >
      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search pending submissions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Pending Tools */}
          <div className="space-y-4">
            {pendingTools.map((tool) => (
              <Card key={tool.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{tool.name}</h3>
                        <Badge className={getRiskBadgeColor(tool.riskLevel)}>
                          {tool.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {tool.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium">Vendor:</span> {tool.vendor}</p>
                        <p><span className="font-medium">Category:</span> {tool.category}</p>
                        <p><span className="font-medium">Submitted:</span> {tool.submittedDate}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Compliance Claims:</span>
                          {tool.complianceClaims.map((claim) => (
                            <Badge key={claim} variant="outline" className="text-xs">
                              {claim}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(tool.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(tool.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6">
          <AdminPromotionManagement />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.tool && `${activity.tool} - `}{activity.vendor}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Vendor management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
};

export default MarketplaceAdmin;