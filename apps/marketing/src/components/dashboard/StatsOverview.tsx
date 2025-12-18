import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface DashboardStats {
  totalClients: number;
  activeCompliance: number;
  pendingReviews: number;
  conflictsDetected: number;
}

interface StatsOverviewProps {
  stats: DashboardStats;
}

const StatsOverview = ({ stats }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Compliance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCompliance}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conflicts Detected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conflictsDetected}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;