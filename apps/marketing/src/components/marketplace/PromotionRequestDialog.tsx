import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Crown, Rocket, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PromotionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: number;
  toolName: string;
}

const PromotionRequestDialog = ({ isOpen, onClose, toolId, toolName }: PromotionRequestDialogProps) => {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const promotionTiers = [
    {
      id: 'standard',
      name: 'Standard Promotion',
      icon: Rocket,
      price: '$299/month',
      features: [
        'Higher search ranking',
        'Basic analytics',
        'Standard support'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'premium',
      name: 'Premium Placement',
      icon: Crown,
      price: '$599/month',
      features: [
        'Priority search ranking',
        'Advanced analytics',
        'Priority support',
        'Featured in category'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'featured',
      name: 'Featured Listing',
      icon: Star,
      price: '$999/month',
      features: [
        'Top marketplace placement',
        'Premium analytics dashboard',
        'Dedicated account manager',
        'Custom promotional content',
        'Newsletter inclusion'
      ],
      color: 'from-amber-400 to-orange-500'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedTier || !duration || !businessJustification.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTierData = promotionTiers.find(tier => tier.id === selectedTier);
      
      // Calculate expires_at based on duration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (parseInt(duration) * 30));

      const { error } = await supabase
        .from('vendor_promotions')
        .insert([
          {
            tool_id: toolId,
            promotion_tier: selectedTier,
            duration_days: parseInt(duration) * 30, // Convert months to days
            expires_at: expiresAt.toISOString(),
            status: 'pending_approval',
            vendor_id: '550e8400-e29b-41d4-a716-446655440001', // Mock vendor ID
            amount_paid: 0, // Will be updated when approved and payment processed
            analytics_data: {
              business_justification: businessJustification,
              requested_tier: selectedTierData?.name,
              estimated_monthly_cost: selectedTierData?.price
            }
          }
        ]);

      if (error) throw error;

      toast.success('Promotion request submitted successfully! Our team will review it within 2 business days.');
      onClose();
      
      // Reset form
      setSelectedTier('');
      setDuration('');
      setBusinessJustification('');
    } catch (error) {
      console.error('Error submitting promotion request:', error);
      toast.error('Failed to submit promotion request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Promotion for {toolName}</DialogTitle>
          <p className="text-muted-foreground">
            Boost your tool's visibility and drive more qualified leads
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Promotion Tiers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Promotion Tier</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {promotionTiers.map((tier) => {
                const Icon = tier.icon;
                const isSelected = selectedTier === tier.id;
                
                return (
                  <Card
                    key={tier.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:shadow-md border-border'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-lg">{tier.name}</h4>
                        <p className="text-2xl font-bold text-primary mt-2">{tier.price}</p>
                      </div>
                      
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {isSelected && (
                        <Badge className="w-full mt-4 bg-primary text-primary-foreground">
                          Selected
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select promotion duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months (5% discount)</SelectItem>
                <SelectItem value="6">6 Months (10% discount)</SelectItem>
                <SelectItem value="12">12 Months (15% discount)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Business Justification */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Business Justification <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Describe why you'd like to promote this tool and your expected ROI..."
              value={businessJustification}
              onChange={(e) => setBusinessJustification(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedTier || !duration || !businessJustification.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionRequestDialog;