import React from 'react';
import Navigation from '@/components/Navigation';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import PromotionManagement from '@/components/marketplace/PromotionManagement';

const VendorPromotions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <StandardPageLayout
        title="Promotion Management"
        subtitle="Boost your tool visibility and drive more qualified leads"
      >
        <PromotionManagement />
      </StandardPageLayout>
    </div>
  );
};

export default VendorPromotions;