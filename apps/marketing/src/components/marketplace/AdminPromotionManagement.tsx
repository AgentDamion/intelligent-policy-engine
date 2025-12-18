import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Crown, Rocket, Search, Eye, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromotionRequest {
  id: string;
  tool_id: number;
  promotion_tier: string;
  duration_days: number;
  status: string;
  created_at: string;
  analytics_data: any;
  tool_name?: string;
  vendor_name?: string;
}

const AdminPromotionManagement = () => {
  const [pendingRequests, setPendingRequests] = useState<PromotionRequest[]>([]);
  const [activePromotions, setActivePromotions] = useState<PromotionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionRequests();
  }, []);

  const fetchPromotionRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_promotions')
        .select(`
          *,
          marketplace_tools!tool_id (
            name,
            enterprises!vendor_enterprise_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithDetails = data?.map(request => ({
        ...request,
        tool_name: (request.marketplace_tools as any)?.name || 'Unknown Tool',
        vendor_name: (request.marketplace_tools as any)?.enterprises?.name || 'Unknown Vendor',
        duration_months: Math.round(request.duration_days / 30) // Convert days to months for display
      })) || [];

      setPendingRequests(requestsWithDetails.filter(r => r.status === 'pending_approval'));
      setActivePromotions(requestsWithDetails.filter(r => r.status === 'active'));
    } catch (error) {
      console.error('Error fetching promotion requests:', error);
      toast.error('Failed to load promotion requests');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, tier: string, durationDays: number) => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error } = await supabase
        .from('vendor_promotions')
        .update({
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Promotion request approved successfully');
      fetchPromotionRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve promotion request');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_promotions')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Promotion request rejected');
      fetchPromotionRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject promotion request');
    }
  };

  const getPromotionIcon = (tier: string) => {
    switch (tier) {
      case 'featured': return Star;
      case 'premium': return Crown;
      case 'standard': return Rocket;
      default: return Rocket;
    }
  };

  const getPromotionColor = (tier: string) => {
    switch (tier) {
      case 'featured': return 'from-amber-400 to-orange-500';
      case 'premium': return 'from-purple-500 to-pink-500';
      case 'standard': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const RequestCard = ({ request }: { request: PromotionRequest }) => {
    const Icon = getPromotionIcon(request.promotion_tier);
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getPromotionColor(request.promotion_tier)} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{request.tool_name}</h3>
                <p className="text-sm text-muted-foreground">{request.vendor_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {request.promotion_tier} • {Math.round(request.duration_days / 30)} months
                        </p>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedRequest(request)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Review
            </Button>
            {request.status === 'pending_approval' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => approveRequest(request.id, request.promotion_tier, request.duration_days)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => rejectRequest(request.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const adminStats = [
    { title: 'Pending Requests', value: pendingRequests.length.toString(), icon: Star, color: 'text-yellow-600' },
    { title: 'Active Promotions', value: activePromotions.length.toString(), icon: TrendingUp, color: 'text-green-600' },
    { title: 'Monthly Revenue', value: '$12,847', icon: DollarSign, color: 'text-purple-600' },
    { title: 'Conversion Rate', value: '23.4%', icon: CheckCircle, color: 'text-blue-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="active">Active Promotions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Search */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search promotion requests..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Pending Requests */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePromotions.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promotion Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Detailed analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Promotion Request</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tool Name</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.tool_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Vendor</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.vendor_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Promotion Tier</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedRequest.promotion_tier}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-muted-foreground">{Math.round(selectedRequest.duration_days / 30)} months</p>
                </div>
              </div>

              {selectedRequest.analytics_data?.business_justification && (
                <div>
                  <label className="text-sm font-medium">Business Justification</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedRequest.analytics_data.business_justification}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
                {selectedRequest.status === 'pending_approval' && (
                  <>
                    <Button 
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => rejectRequest(selectedRequest.id)}
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => approveRequest(selectedRequest.id, selectedRequest.promotion_tier, selectedRequest.duration_days)}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPromotionManagement;