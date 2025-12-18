import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertTriangle, Clock, Eye } from 'lucide-react';
import { usePolicyInbox } from '@/hooks/usePolicyInbox';

const PolicyInbox: React.FC = () => {
  const { 
    policyNotifications, 
    loading, 
    acknowledgePolicy, 
    markAsImplemented,
    newPoliciesCount 
  } = usePolicyInbox();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'implemented':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Policy Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading policy updates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Policy Updates
              {newPoliciesCount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {newPoliciesCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Latest compliance policies from enterprise partners
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {policyNotifications.length > 0 ? (
          <div className="space-y-4">
            {policyNotifications.map((notification) => (
              <div key={notification.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{notification.policy.title}</h4>
                      <Badge 
                        className={`flex items-center gap-1 ${getStatusColor(notification.status)}`}
                      >
                        {getStatusIcon(notification.status)}
                        {notification.status}
                      </Badge>
                      {notification.status === 'new' && (
                        <Badge className="bg-red-100 text-red-800 animate-pulse">
                          Action Required
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">{notification.policy.description}</p>

                    {/* Requirements */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-2">Key Requirements:</h5>
                      <div className="space-y-1">
                        {notification.policy.requirements.slice(0, 2).map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>{req}</span>
                          </div>
                        ))}
                        {notification.policy.requirements.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{notification.policy.requirements.length - 2} more requirements
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Tools */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-2">Approved AI Tools:</h5>
                      <div className="flex flex-wrap gap-1">
                        {notification.policy.aiTools.map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Received {new Date(notification.receivedAt).toLocaleString()}
                      {notification.acknowledgedAt && (
                        <span> • Acknowledged {new Date(notification.acknowledgedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {notification.status === 'new' && (
                      <Button 
                        size="sm"
                        onClick={() => acknowledgePolicy(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    
                    {notification.status === 'acknowledged' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => markAsImplemented(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No policy updates</p>
            <p className="text-sm">You're all caught up with the latest policies</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PolicyInbox;