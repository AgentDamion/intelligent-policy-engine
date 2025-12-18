import React from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminRoleProvider } from '@/contexts/AdminRoleContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <AdminRoleProvider>
      <div className="min-h-screen bg-background">
        <AdminTopBar />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminRoleProvider>
  );
};