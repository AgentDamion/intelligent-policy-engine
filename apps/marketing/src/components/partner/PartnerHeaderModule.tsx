import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileCheck, TrendingUp } from 'lucide-react';

interface PartnerHeaderModuleProps {
  complianceScore?: number;
  totalClients?: number;
  toolsSubmitted?: number;
  compliancePercentage?: number;
}

export const PartnerHeaderModule: React.FC<PartnerHeaderModuleProps> = ({
  complianceScore = 98,
  totalClients = 12,
  toolsSubmitted = 25,
  compliancePercentage = 98
}) => {
  return (
    <Card className="border shadow-sm bg-gradient-to-br from-background to-muted/20">
      <div className="p-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-brand font-bold text-foreground">
            Partner Compliance Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage compliance across all client relationships
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left - Compliance Readiness Score */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-coral to-brand-orange p-1">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{complianceScore}</div>
                    <div className="text-xs text-muted-foreground font-medium">Score</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Compliance Readiness Score
              </div>
              <div className="text-lg font-semibold text-foreground">
                Excellent Standing
              </div>
              <div className="text-sm text-muted-foreground">
                All systems operational
              </div>
            </div>
          </div>

          {/* Center - Status Chips */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              variant="secondary" 
              className="bg-brand-teal/10 text-brand-teal border-brand-teal/20 px-3 py-1"
            >
              <span className="font-medium">{totalClients} Clients</span>
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-brand-orange/10 text-brand-orange border-brand-orange/20 px-3 py-1"
            >
              <span className="font-medium">{toolsSubmitted} Tools Submitted</span>
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-brand-coral/10 text-brand-coral border-brand-coral/20 px-3 py-1"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              <span className="font-medium">{compliancePercentage}% Compliance</span>
            </Badge>
          </div>

          {/* Right - Action CTAs */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="border-brand-coral text-brand-coral hover:bg-brand-coral hover:text-white"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              View RFP Readiness
            </Button>
            <Button 
              className="bg-gradient-to-r from-brand-coral to-brand-orange hover:from-brand-coral/90 hover:to-brand-orange/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Tool
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};