import React, { useEffect } from 'react';
import VendorDashboard from '@/components/vendor/VendorDashboard';
import { useMode } from '@/contexts/ModeContext';

const VendorDashboardPage = () => {
  const { setMode } = useMode();

  useEffect(() => {
    setMode('vendor' as any);
  }, [setMode]);

  return <VendorDashboard />;
};

export default VendorDashboardPage;