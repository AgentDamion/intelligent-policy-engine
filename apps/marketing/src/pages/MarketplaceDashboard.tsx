import React, { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { MetricCard } from '@/components/common/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  PenTool,
  Image,
  Video,
  BarChart3,
  Zap,
  Headphones,
  Star,
  Users,
  Calendar
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  complianceScore: number;
  status: 'approved' | 'pending' | 'restricted';
  governance: 'high' | 'medium' | 'low';
  partnerUsage: number;
  isFeatured?: boolean;
  isNew?: boolean;
  dateAdded?: string;
}

const sampleTools: Tool[] = [
  {
    id: '1',
    name: 'ChatGPT-4',
    description: 'Advanced conversational AI for content generation, coding assistance, and complex reasoning tasks.',
    category: 'Content Generation',
    complianceScore: 95,
    status: 'approved',
    governance: 'high',
    partnerUsage: 247,
    isFeatured: true
  },
  {
    id: '2',
    name: 'Claude AI',
    description: 'Constitutional AI assistant for safe, helpful, and harmless interactions across various domains.',
    category: 'Content Generation',
    complianceScore: 88,
    status: 'approved',
    governance: 'high',
    partnerUsage: 156,
    isFeatured: true
  },
  {
    id: '3',
    name: 'DALL-E 3',
    description: 'State-of-the-art image generation AI that creates detailed images from text descriptions.',
    category: 'Image Generation',
    complianceScore: 92,
    status: 'approved',
    governance: 'medium',
    partnerUsage: 189,
    isFeatured: true
  },
  {
    id: '4',
    name: 'Tableau AI',
    description: 'Advanced analytics and data visualization with AI-powered insights and automated analysis.',
    category: 'Data Analysis',
    complianceScore: 96,
    status: 'approved',
    governance: 'high',
    partnerUsage: 312,
    isFeatured: true
  },
  {
    id: '5',
    name: 'Midjourney',
    description: 'AI-powered image generation tool for creating artistic and photorealistic images.',
    category: 'Image Generation',
    complianceScore: 76,
    status: 'restricted',
    governance: 'medium',
    partnerUsage: 89
  },
  {
    id: '6',
    name: 'Runway ML',
    description: 'AI-powered video generation and editing tools for creative professionals.',
    category: 'Video Production',
    complianceScore: 84,
    status: 'pending',
    governance: 'medium',
    partnerUsage: 47,
    isNew: true,
    dateAdded: 'Jan 11'
  }
];

const categories = [
  { name: 'Text & Content AI', icon: PenTool, count: 23 },
  { name: 'Image Generation', icon: Image, count: 15 },
  { name: 'Video Production', icon: Video, count: 8 },
  { name: 'Data Analysis', icon: BarChart3, count: 19 },
  { name: 'Marketing Automation', icon: Zap, count: 12 },
  { name: 'Customer Support', icon: Headphones, count: 7 }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'restricted':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'restricted':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getGovernanceColor = (governance: string) => {
  switch (governance) {
    case 'high':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'medium':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const MarketplaceDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const featuredTools = sampleTools.filter(tool => tool.isFeatured);
  const newTools = sampleTools.filter(tool => tool.isNew);

  return (
    <StandardPageLayout
      title="AI Tools Marketplace"
      subtitle="Discover and request AI tools with built-in compliance verification"
    >
      <div className="space-y-8">
        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search for AI tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  All Categories
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  All Statuses
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  Partner usage
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trending Tools */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Trending Tools</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTools.map((tool) => (
              <Card key={tool.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Featured
                      </Badge>
                      <span className="text-sm font-medium text-green-600">
                        {tool.complianceScore}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tool.status)}
                    <Badge className={getStatusColor(tool.status)}>
                      {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{tool.category}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {tool.partnerUsage} partners
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant={tool.status === 'approved' ? 'default' : 'outline'}
                  >
                    {tool.status === 'approved' ? 'View Details' : 'Check Status'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Browse by Category */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card key={category.name} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 pb-4">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.count} tools</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Tools */}
        <div>
          <h2 className="text-xl font-semibold mb-6">All Tools ({sampleTools.length})</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sampleTools.map((tool) => (
              <Card key={tool.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-medium text-green-600">
                        {tool.complianceScore}%
                      </span>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(tool.status)}>
                          {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                        </Badge>
                        <Badge className={getGovernanceColor(tool.governance)}>
                          {tool.governance}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{tool.category}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {tool.partnerUsage} partners
                      </div>
                    </div>
                    <Button 
                      variant={tool.status === 'approved' ? 'default' : 'outline'}
                    >
                      {tool.status === 'approved' ? 'View Details' : 
                       tool.status === 'pending' ? 'Check Status' : 'Request Access'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recently Added */}
        {newTools.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Recently Added</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newTools.map((tool) => (
                <Card key={tool.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          New
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {tool.dateAdded}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tool.status)}
                      <Badge className={getStatusColor(tool.status)}>
                        {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">{tool.category}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {tool.partnerUsage} partners
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default MarketplaceDashboard;