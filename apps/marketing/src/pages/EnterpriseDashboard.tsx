import React, { useEffect } from 'react';
import EnterpriseDashboard from '@/components/enterprise/EnterpriseDashboard';
import { useMode } from '@/contexts/ModeContext';

const EnterpriseDashboardPage = () => {
  const { setMode } = useMode();

  useEffect(() => {
    setMode('enterprise');
  }, [setMode]);

  return <EnterpriseDashboard />;
};

export default EnterpriseDashboardPage;