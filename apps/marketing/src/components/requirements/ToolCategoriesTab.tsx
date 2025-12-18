import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle, Clock, XCircle, Shield } from 'lucide-react';
import { useClientToolCategories } from '@/hooks/useClientToolCategories';

interface ToolCategoriesTabProps {
  clientId?: string;
}

export const ToolCategoriesTab = ({ clientId }: ToolCategoriesTabProps) => {
  const { categories, loading, toggleCategory } = useClientToolCategories(clientId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'not_allowed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'not_allowed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="pb-3">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="text-left">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              </div>
              {category.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          
          {category.expanded && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {category.tools.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tool.status)}
                        <span className="font-medium">{tool.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(tool.status)} variant="outline">
                          {tool.status === 'approved' ? 'Approved' : 
                           tool.status === 'pending' ? 'Pending' : 'Not Allowed'}
                        </Badge>
                        
                        <Badge className={getRiskColor(tool.riskLevel)} variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          {tool.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>

                    {tool.compliance.length > 0 && (
                      <div className="flex items-center gap-1">
                        {tool.compliance.map((comp, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tool Categories Found</h3>
            <p className="text-muted-foreground">
              Tool categories will appear here once policies are configured for this client.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};