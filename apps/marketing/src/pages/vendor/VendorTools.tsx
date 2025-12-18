import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';

const VendorTools = () => {
  // Mock data for demonstration
  const tools = [
    {
      id: 1,
      name: "AI Content Generator",
      status: "active",
      category: "Content Creation",
      views: 1250,
      rating: 4.8,
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      name: "Smart Analytics Tool",
      status: "pending",
      category: "Analytics",
      views: 0,
      rating: 0,
      lastUpdated: "2024-01-20"
    },
    {
      id: 3,
      name: "Workflow Optimizer",
      status: "active",
      category: "Productivity",
      views: 850,
      rating: 4.6,
      lastUpdated: "2024-01-10"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Tools</h1>
          <p className="text-muted-foreground">Manage your submitted AI tools</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit New Tool
        </Button>
      </div>

      <div className="grid gap-6">
        {tools.map((tool) => (
          <Card key={tool.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {tool.name}
                    {getStatusBadge(tool.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{tool.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
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
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Views</p>
                  <p className="text-muted-foreground">{tool.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Rating</p>
                  <p className="text-muted-foreground">
                    {tool.rating > 0 ? `${tool.rating}/5.0` : 'No ratings yet'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">{tool.lastUpdated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorTools;