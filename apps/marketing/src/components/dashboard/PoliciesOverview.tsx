import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Policy {
  id: string;
  name: string;
  status: string;
  lastUpdated: string;
}

interface PoliciesOverviewProps {
  policies: Policy[];
  loading: boolean;
}

const PoliciesOverview = ({ policies, loading }: PoliciesOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Policies</CardTitle>
        <CardDescription>All your agency's compliance rules—always under watch</CardDescription>
      </CardHeader>
      <CardContent>
        {policies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((policy, index) => (
              <div key={policy.id || index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{policy.name || `Policy ${index + 1}`}</h4>
                  <Badge variant="outline">{policy.status || 'Active'}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Updated: {policy.lastUpdated ? new Date(policy.lastUpdated).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 relative">
            {/* Feather watermark for empty state */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 opacity-10">
              <img 
                src="/lovable-uploads/ffa9b3f4-ff9a-40c6-bc91-8ece3547ab12.png" 
                alt="Feather" 
                className="w-8 h-8" 
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">
                {loading ? 'Checking policy status...' : 'No compliance policies configured yet.'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {!loading && 'Create your first policy and let your copilot monitor for changes and risks—around the clock.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PoliciesOverview;