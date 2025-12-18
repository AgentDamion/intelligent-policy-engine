import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle } from 'lucide-react';
import { BrandIcon } from '@/components/brand/BrandIcon';

interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

interface DashboardHeaderProps {
  healthStatus: HealthStatus | null;
  lastRefresh: Date;
}

const DashboardHeader = ({ healthStatus, lastRefresh }: DashboardHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-white to-bg-teal-light/20 rounded-lg border p-6 shadow-sm relative overflow-hidden">
      {/* Brand watermark */}
      <div className="absolute top-4 right-4 opacity-10">
        <BrandIcon size="large" variant="light" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Your Compliance Command Center
            </h1>
            <p className="text-gray-600">Meet your hummingbird copilot—always vigilant, always here to help your agency stay compliant, fast.</p>
          </div>
          <div className="flex items-center gap-2">
            {healthStatus && (
              <div className="flex items-center gap-2">
                {healthStatus.status === 'healthy' ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-teal rounded-full animate-ping opacity-20"></div>
                    <CheckCircle className="h-4 w-4 text-teal relative z-10" />
                  </div>
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium text-teal">
                  {healthStatus?.status || 'Checking...'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="text-sm font-medium text-gray-800">{lastRefresh.toLocaleTimeString()}</p>
          </div>
          <Avatar className="border-2 border-teal/20">
            <AvatarFallback className="bg-teal text-white font-semibold">AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;