import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import RouteAnalyticsDashboard from '@/components/route/RouteAnalyticsDashboard';

const RouteAnalyticsDashboardPage: React.FC = () => {
  return (
    <StandardPageLayout
      title="Route Analytics"
      description="Advanced analytics and insights for application routes"
    >
      <RouteAnalyticsDashboard />
    </StandardPageLayout>
  );
};

export default RouteAnalyticsDashboardPage;