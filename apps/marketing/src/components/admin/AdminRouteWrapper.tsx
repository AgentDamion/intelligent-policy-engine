import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';

interface AdminRouteWrapperProps {
  children: React.ReactNode;
}

export const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({ children }) => {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};