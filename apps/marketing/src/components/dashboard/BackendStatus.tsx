import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface ApiInfo {
  status: string;
  message: string;
  timestamp: string;
  endpoints: string[];
}

interface BackendStatusProps {
  apiInfo: ApiInfo | null;
}

const BackendStatus = ({ apiInfo }: BackendStatusProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Health</CardTitle>
        <CardDescription>Your aicomplyr.io hummingbird is online and scanning—all systems go!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Platform Active</p>
                <p className="text-sm text-gray-600">{apiInfo?.message || 'Your hummingbird copilot is ready and monitoring'}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Live</Badge>
          </div>
          
          {apiInfo?.endpoints && (
            <div>
              <h4 className="font-medium mb-2">Active Connections ({apiInfo.endpoints.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {apiInfo.endpoints.map((endpoint, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {endpoint}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendStatus;