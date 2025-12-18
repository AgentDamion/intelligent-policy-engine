import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, TrendingUp, Shield, Users } from 'lucide-react';
import { VendorAnalytics } from '@/hooks/useToolIntelligence';

interface VendorAnalysisProps {
  data: VendorAnalytics[];
  loading?: boolean;
}

export const VendorAnalysis: React.FC<VendorAnalysisProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vendor Analysis
          </CardTitle>
          <CardDescription>
            Risk and compliance analysis by vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore < 30) return 'bg-green-100 text-green-800';
    if (riskScore < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const sortedData = [...data].sort((a, b) => b.marketShare - a.marketShare);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Vendor Analysis
        </CardTitle>
        <CardDescription>
          Risk and compliance analysis across {data.length} vendors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((vendor) => (
            <div 
              key={vendor.vendorName} 
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-lg">{vendor.vendorName}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {vendor.toolCount} tools
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {vendor.totalUsage} total uses
                    </span>
                  </div>
                </div>
                <Badge 
                  className={getRiskBadgeColor(vendor.avgRiskScore)}
                  variant="outline"
                >
                  Risk: {Math.round(vendor.avgRiskScore)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Compliance Rate
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(vendor.complianceRate)}%
                    </span>
                  </div>
                  <Progress value={vendor.complianceRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Market Share
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(vendor.marketShare * 10) / 10}%
                    </span>
                  </div>
                  <Progress value={vendor.marketShare} className="h-2" />
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vendor data available. Start tracking AI tool usage to see vendor analysis.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};