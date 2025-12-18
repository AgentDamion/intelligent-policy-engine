import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Pause, Play, Trash2 } from 'lucide-react';

const VendorPromotions = () => {
  // Mock data for demonstration
  const promotions = [
    {
      id: 1,
      title: "50% Off AI Content Generator",
      toolName: "AI Content Generator",
      discount: 50,
      type: "percentage",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      status: "active",
      uses: 125,
      maxUses: 1000
    },
    {
      id: 2,
      title: "Free Trial Extension",
      toolName: "Smart Analytics Tool",
      discount: 0,
      type: "trial",
      startDate: "2024-01-20",
      endDate: "2024-03-20",
      status: "paused",
      uses: 45,
      maxUses: 500
    },
    {
      id: 3,
      title: "Early Bird Special",
      toolName: "Workflow Optimizer",
      discount: 30,
      type: "percentage",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      status: "expired",
      uses: 250,
      maxUses: 250
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPromotionText = (promotion: any) => {
    if (promotion.type === 'percentage') {
      return `${promotion.discount}% off`;
    } else if (promotion.type === 'trial') {
      return 'Extended free trial';
    }
    return 'Special offer';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">Manage promotional campaigns for your tools</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Promotion
        </Button>
      </div>

      <div className="grid gap-6">
        {promotions.map((promotion) => (
          <Card key={promotion.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {promotion.title}
                    {getStatusBadge(promotion.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{promotion.toolName}</p>
                </div>
                <div className="flex gap-2">
                  {promotion.status === 'active' && (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {promotion.status === 'paused' && (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Offer</p>
                  <p className="text-muted-foreground">{getPromotionText(promotion)}</p>
                </div>
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">
                    {promotion.startDate} - {promotion.endDate}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Usage</p>
                  <p className="text-muted-foreground">
                    {promotion.uses} / {promotion.maxUses}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Conversion</p>
                  <p className="text-muted-foreground">
                    {((promotion.uses / promotion.maxUses) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorPromotions;