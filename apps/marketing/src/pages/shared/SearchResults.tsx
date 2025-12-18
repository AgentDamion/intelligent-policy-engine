import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Users, Shield, CheckCircle, Building } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);

  // Mock search results grouped by entity type
  const searchResults = {
    policies: [
      { id: '1', title: 'Medical Device AI Policy', type: 'Policy', status: 'Active', relevance: 95 },
      { id: '2', title: 'Data Privacy Policy', type: 'Policy', status: 'Active', relevance: 87 }
    ],
    tools: [
      { id: '1', title: 'MedLens AI Diagnostic Assistant', type: 'Tool', vendor: 'MedTech Solutions', relevance: 92 },
      { id: '2', title: 'Radiology AI Analyzer', type: 'Tool', vendor: 'ImageTech Inc', relevance: 85 }
    ],
    submissions: [
      { id: '1', title: 'Oncology AI Initiative', type: 'Submission', status: 'Under Review', relevance: 88 },
      { id: '2', title: 'Diagnostic Tool Submission', type: 'Submission', status: 'Approved', relevance: 82 }
    ],
    partners: [
      { id: '1', title: 'MedTech Innovations', type: 'Partner', status: 'Active', relevance: 90 },
      { id: '2', title: 'Healthcare AI Solutions', type: 'Partner', status: 'Active', relevance: 76 }
    ]
  };

  const totalResults = Object.values(searchResults).flat().length;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-brand-green text-white';
      case 'approved': return 'bg-brand-green text-white';
      case 'under review': return 'bg-brand-orange text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'policy': return <Shield className="h-4 w-4" />;
      case 'tool': return <Building className="h-4 w-4" />;
      case 'submission': return <FileText className="h-4 w-4" />;
      case 'partner': return <Users className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const renderResultCard = (result: any) => (
    <Card key={result.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-brand-teal">
              {getIcon(result.type)}
            </div>
            <div className="space-y-1">
              <h3 className="font-medium hover:text-brand-teal cursor-pointer">
                {result.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{result.type}</Badge>
                {result.vendor && <span>by {result.vendor}</span>}
                {result.status && (
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {result.relevance}% match
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies, tools, audits, partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button>Search</Button>
          </div>
          
          {query && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {totalResults} results for</span>
              <span className="font-medium text-foreground">"{query}"</span>
            </div>
          )}
        </div>

        {/* Results Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="policies">Policies ({searchResults.policies.length})</TabsTrigger>
            <TabsTrigger value="tools">Tools ({searchResults.tools.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({searchResults.submissions.length})</TabsTrigger>
            <TabsTrigger value="partners">Partners ({searchResults.partners.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {Object.entries(searchResults).map(([category, results]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-lg font-semibold capitalize">{category}</h2>
                <div className="space-y-2">
                  {results.map(renderResultCard)}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="policies">
            <div className="space-y-2">
              {searchResults.policies.map(renderResultCard)}
            </div>
          </TabsContent>

          <TabsContent value="tools">
            <div className="space-y-2">
              {searchResults.tools.map(renderResultCard)}
            </div>
          </TabsContent>

          <TabsContent value="submissions">
            <div className="space-y-2">
              {searchResults.submissions.map(renderResultCard)}
            </div>
          </TabsContent>

          <TabsContent value="partners">
            <div className="space-y-2">
              {searchResults.partners.map(renderResultCard)}
            </div>
          </TabsContent>
        </Tabs>

        {/* No Results */}
        {totalResults === 0 && query && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try different keywords or check your spelling.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchResults;