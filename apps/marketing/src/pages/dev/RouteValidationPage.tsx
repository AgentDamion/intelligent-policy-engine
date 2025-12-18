import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import RouteValidationDashboard from '@/components/route/RouteValidationDashboard';

const RouteValidationPage: React.FC = () => {
  return (
    <StandardPageLayout
      title="Route Validation"
      description="Comprehensive route testing and validation dashboard"
    >
      <RouteValidationDashboard />
    </StandardPageLayout>
  );
};

export default RouteValidationPage;