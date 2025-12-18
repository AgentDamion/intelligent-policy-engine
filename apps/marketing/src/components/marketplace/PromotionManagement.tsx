import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Crown, Rocket, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PromotionRequestDialog from './PromotionRequestDialog';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  tool_id: number;
  promotion_tier: string;
  status: string;
  expires_at: string;
  created_at: string;
  duration_days: number;
  analytics_data: any;
  tool_name?: string;
}

const PromotionManagement = () => {
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Promotion[]>([]);
  const [promotionHistory, setPromotionHistory] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_promotions')
        .select(`
          *,
          marketplace_tools!tool_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const promotionsWithToolNames = data?.map(promo => ({
        ...promo,
        tool_name: (promo.marketplace_tools as any)?.name || 'Unknown Tool',
        duration_months: Math.round(promo.duration_days / 30) // Convert days to months for display
      })) || [];

      // Separate by status
      setActivePromotions(promotionsWithToolNames.filter(p => p.status === 'active'));
      setPendingRequests(promotionsWithToolNames.filter(p => p.status === 'pending_approval'));
      setPromotionHistory(promotionsWithToolNames.filter(p => ['expired', 'cancelled', 'rejected'].includes(p.status)));
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
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
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const cancelPromotion = async (promotionId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_promotions')
        .update({ status: 'cancelled' })
        .eq('id', promotionId);

      if (error) throw error;

      toast.success('Promotion cancelled successfully');
      fetchPromotions();
    } catch (error) {
      console.error('Error cancelling promotion:', error);
      toast.error('Failed to cancel promotion');
    }
  };

  const PromotionCard = ({ promotion }: { promotion: Promotion }) => {
    const Icon = getPromotionIcon(promotion.promotion_tier);
    const daysRemaining = Math.ceil((new Date(promotion.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getPromotionColor(promotion.promotion_tier)} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{promotion.tool_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {promotion.promotion_tier} Promotion
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(promotion.status)}>
              {promotion.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{promotion.status === 'active' ? `${daysRemaining} days left` : 'Expired'}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span>{promotion.analytics_data?.impressions || 0} impressions</span>
            </div>
          </div>

          {promotion.status === 'active' && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => cancelPromotion(promotion.id)}
              >
                Cancel Promotion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promotion Management</h2>
          <p className="text-muted-foreground">Manage your tool promotions and track performance</p>
        </div>
        <Button onClick={() => setSelectedTool({ id: 1, name: 'Sample Tool' })}>
          Request Promotion
        </Button>
      </div>

      {/* Promotion Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Promotions</p>
                <p className="text-2xl font-bold">{activePromotions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold">$1,497</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">45.2K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Promotions</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePromotions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active promotions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePromotions.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {promotionHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No promotion history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotionHistory.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Promotion Request Dialog */}
      {selectedTool && (
        <PromotionRequestDialog
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          toolId={selectedTool.id}
          toolName={selectedTool.name}
        />
      )}
    </div>
  );
};

export default PromotionManagement;