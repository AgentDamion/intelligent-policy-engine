import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { useMode } from '@/contexts/ModeContext';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users, 
  TrendingUp
} from 'lucide-react';

const PartnerDashboard: React.FC = () => {
  const { setMode } = useMode();

  useEffect(() => {
    setMode('partner');
  }, [setMode]);

  // Sample data for partner dashboard
  const clientStats = [
    { name: 'Client A', compliance: 95, status: 'compliant', tools: 12 },
    { name: 'Client B', compliance: 78, status: 'review', tools: 8 },
    { name: 'Client C', compliance: 100, status: 'compliant', tools: 15 },
  ];

  const recentSubmissions = [
    { id: 1, tool: 'ChatGPT-4', client: 'Client A', status: 'approved', date: '2024-01-15' },
    { id: 2, tool: 'Claude AI', client: 'Client B', status: 'pending', date: '2024-01-14' },
    { id: 3, tool: 'Midjourney', client: 'Client C', status: 'flagged', date: '2024-01-13' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'compliant':
        return 'bg-green-500';
      case 'pending':
      case 'review':
        return 'bg-yellow-500';
      case 'flagged':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">{/* Header removed - now handled by PartnerHeaderModule */}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tools Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">
              +12 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              2 urgent reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Client Compliance Status</CardTitle>
          <CardDescription>
            Overview of compliance across all your client relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientStats.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.tools} tools managed
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{client.compliance}%</div>
                    <Progress value={client.compliance} className="w-20" />
                  </div>
                  <Badge variant={client.status === 'compliant' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest tool submissions across all clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(submission.status)}`} />
                  <div>
                    <div className="font-medium">{submission.tool}</div>
                    <div className="text-sm text-muted-foreground">
                      {submission.client} • {submission.date}
                    </div>
                  </div>
                </div>
                <Badge variant={submission.status === 'approved' ? 'default' : 'secondary'}>
                  {submission.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDashboard;