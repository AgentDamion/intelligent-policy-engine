import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Search, Filter, Star, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceTools } from '@/hooks/useMarketplaceTools';

const ToolCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const navigate = useNavigate();

  const filters = {
    searchTerm,
    industries: categoryFilter === 'all' ? [] : [categoryFilter],
    compliance: complianceFilter === 'all' ? [] : [complianceFilter],
    dataTypes: [],
    agenticVerified: false
  };

  const { tools, loading } = useMarketplaceTools(filters);

  const categories = [
    'Healthcare AI',
    'Financial Analytics', 
    'Marketing Automation',
    'Legal Tech',
    'Manufacturing',
    'Education'
  ];

  const complianceTypes = [
    'HIPAA',
    'SOX',
    'GDPR',
    'FDA',
    'ISO 27001'
  ];

  return (
    <StandardPageLayout
      title="AI Tools Catalog"
      subtitle="Discover and evaluate compliance-ready AI tools"
    >
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tools, vendors, or capabilities..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={complianceFilter} onValueChange={setComplianceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Compliance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Compliance</SelectItem>
              {complianceTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-muted-foreground">
              Found {tools.length} tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{tool.vendor_name || 'Unknown Vendor'}</p>
                    </div>
                    <Badge 
                      variant={tool.status === 'verified' ? 'default' : 'secondary'}
                      className={tool.status === 'verified' ? 'bg-green-100 text-green-800' : ''}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {tool.status === 'verified' ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {tool.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                      {tool.compliance_certifications.map((cert: string) => (
                        <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm ml-1">4.5</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ${tool.pricing_tier}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {tool.website && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={tool.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => navigate(`/marketplace/tools/${tool.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tools found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setComplianceFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </>
      )}
    </StandardPageLayout>
  );
};

export default ToolCatalog;