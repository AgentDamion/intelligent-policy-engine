import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Clock, Shield } from 'lucide-react';

interface EnterpriseStats {
  activeAgencies: number;
  activePolicies: number;
  pendingReviews: number;
  complianceRate: number;
}

interface EnterpriseStatsOverviewProps {
  stats: EnterpriseStats;
}

const EnterpriseStatsOverview: React.FC<EnterpriseStatsOverviewProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Active Agencies',
      value: stats.activeAgencies.toString(),
      icon: Users,
      description: 'Partner agencies',
      trend: '+2 this month'
    },
    {
      title: 'Active Policies',
      value: stats.activePolicies.toString(),
      icon: FileText,
      description: 'Compliance policies',
      trend: 'Updated 3 days ago'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews.toString(),
      icon: Clock,
      description: 'Awaiting approval',
      trend: '-5 from yesterday'
    },
    {
      title: 'Compliance Rate',
      value: `${stats.complianceRate}%`,
      icon: Shield,
      description: 'Network average',
      trend: '+2% this quarter'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnterpriseStatsOverview;