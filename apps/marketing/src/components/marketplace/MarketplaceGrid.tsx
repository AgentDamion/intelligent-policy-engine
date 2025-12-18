import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { useMarketplaceTools, type MarketplaceFilters } from '@/hooks/useMarketplaceTools';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { usePromotionAnalytics } from '@/hooks/usePromotionAnalytics';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface MarketplaceGridProps {
  filters?: MarketplaceFilters;
}

const MarketplaceGrid = ({ filters }: MarketplaceGridProps) => {
  const { tools, loading, error } = useMarketplaceTools(filters);
  const { createToolRequest } = useMarketplaceData();
  const { trackImpression, trackClick, trackRequest } = usePromotionAnalytics();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-brand-green" />;
      case 'pending_verification':
        return <Clock className="h-4 w-4 text-brand-orange" />;
      case 'update_required':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'bg-brand-green/10 text-brand-green';
      case 'pending_verification':
        return 'bg-brand-orange/10 text-brand-orange';
      case 'update_required':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleToolRequest = async (tool: any) => {
    setRequestLoading(true);
    try {
      // Mock workspace ID - in real app, get from user context
      const mockWorkspaceId = '660e8400-e29b-41d4-a716-446655440001';
      
      const success = await createToolRequest(tool.id, {
        enterpriseId: "550e8400-e29b-41d4-a716-446655440001",
        workspaceId: "660e8400-e29b-41d4-a716-446655440001",
        businessJustification: 'Required for compliance and operational efficiency',
        expectedUsage: 'Daily operations and compliance monitoring',
        complianceRequirements: Array.isArray(tool.compliance_certifications) 
          ? tool.compliance_certifications.join(', ') 
          : ''
      });
      
      if (success) {
        toast.success('Tool access request submitted successfully');
        setSelectedTool(null);
        
        // Track request event if tool is promoted
        if (tool.is_promoted) {
          trackRequest(tool.id);
        }
      }
    } catch (error) {
      toast.error('Failed to submit tool request');
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-destructive">Error loading marketplace tools: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {tools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tools found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {tools.map((tool) => {
                const getPromotionBorder = () => {
                  if (!tool.is_promoted) return '';
                  switch (tool.promotion_tier) {
                    case 'featured': return 'border-amber-300 shadow-amber-100/50 shadow-lg';
                    case 'premium': return 'border-purple-300 shadow-purple-100/50 shadow-md';
                    case 'standard': return 'border-blue-300 shadow-blue-100/50 shadow-sm';
                    default: return '';
                  }
                };

                const getPromotionBadge = () => {
                  if (!tool.is_promoted) return null;
                  switch (tool.promotion_tier) {
                    case 'featured':
                      return <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">⭐ Featured</Badge>;
                    case 'premium':
                      return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">💎 Premium</Badge>;
                    case 'standard':
                      return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">🚀 Promoted</Badge>;
                    default:
                      return null;
                  }
                };

                return (
                <Card 
                  key={tool.id} 
                  className={`hover:shadow-lg transition-shadow duration-200 ${getPromotionBorder()}`}
                  onMouseEnter={() => {
                    // Track impression for promoted tools
                    if (tool.is_promoted) {
                      trackImpression(tool.id);
                    }
                  }}
                >
                  <CardHeader className="pb-4">
                    {/* Promotion Badge - Top */}
                    {tool.is_promoted && (
                      <div className="mb-3">
                        {getPromotionBadge()}
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{tool.vendor_logo || '🔧'}</div>
                        <div>
                          <h3 className="font-semibold text-foreground">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground">{tool.vendor_name || 'Unknown Vendor'}</p>
                        </div>
                      </div>
                      {tool.status === 'verified' && (
                        <div className="flex items-center">
                          <span className="text-brand-teal text-sm">🪶</span>
                          <Badge className="ml-1 bg-brand-teal/10 text-brand-teal border-brand-teal/20">
                            Agentic Verified
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tool.description || 'No description available'}
                    </p>
                    
                    {/* Compliance Tags */}
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(tool.compliance_certifications) && tool.compliance_certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tool.status)}
                        <Badge className={getStatusColor(tool.status)}>
                          {tool.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tool.category || 'General'}
                      </Badge>
                    </div>
                    
                    {/* Last Check */}
                    <p className="text-xs text-muted-foreground">
                      Agentic AI validated: {new Date(tool.updated_at).toLocaleDateString()}
                    </p>
                    
                    {/* CTA */}
                    <Dialog>
                      <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setSelectedTool(tool);
                          // Track click event for promoted tools
                          if (tool.is_promoted) {
                            trackClick(tool.id);
                          }
                        }}
                      >
                          Learn More / Request Access
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3">
                            <span className="text-2xl">{tool.vendor_logo || '🔧'}</span>
                            {tool.name}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {tool.description || 'No description available'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Vendor</h4>
                            <p className="text-sm text-muted-foreground">{tool.vendor_name || 'Unknown Vendor'}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Compliance Certifications</h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(tool.compliance_certifications) && tool.compliance_certifications.map((cert, index) => (
                                <Badge key={index} variant="outline">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Pricing Tier</h4>
                            <Badge variant="outline">{tool.pricing_tier?.toUpperCase() || 'BASIC'}</Badge>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => handleToolRequest(tool)}
                              disabled={requestLoading}
                              className="flex-1"
                            >
                              {requestLoading ? 'Requesting...' : 'Request Access'}
                            </Button>
                            {tool.website && (
                              <Button variant="outline" asChild>
                                <a href={tool.website} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Visit Website
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
                );
              })}
            </div>
            
            {/* Microcopy */}
            <div className="text-center">
              <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                Agentic AI copilots re-verify every listing with each update, so you're always viewing the latest compliance status.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default MarketplaceGrid;