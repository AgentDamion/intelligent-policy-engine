import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import RouteTestSuite from '@/components/route/RouteTestSuite';

const RouteTestDashboard: React.FC = () => {
  return (
    <StandardPageLayout
      title="Route Testing Dashboard"
      description="Comprehensive testing suite for all application routes"
    >
      <RouteTestSuite />
    </StandardPageLayout>
  );
};

export default RouteTestDashboard;