
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { type MarketplaceFilters } from '@/hooks/useMarketplaceTools';

interface MarketplaceSearchProps {
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

const MarketplaceSearch = ({ onFiltersChange }: MarketplaceSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [agenticVerified, setAgenticVerified] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);

  const industries = ['Pharma', 'Healthcare', 'Marketing', 'Finance', 'Manufacturing'];
  const compliance = ['GDPR', 'HIPAA', 'EU AI Act', 'SOC 2', 'ISO 27001'];
  const dataTypes = ['No PII', 'Healthcare Data', 'Financial Data', 'Personal Data'];

  // Update filters when any value changes
  const updateFilters = () => {
    onFiltersChange({
      searchTerm,
      industries: selectedIndustries,
      compliance: selectedCompliance,
      dataTypes: selectedDataTypes,
      agenticVerified
    });
  };

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({
      searchTerm: value,
      industries: selectedIndustries,
      compliance: selectedCompliance,
      dataTypes: selectedDataTypes,
      agenticVerified
    });
  };

  // Handle checkbox changes
  const handleIndustryChange = (industry: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedIndustries, industry]
      : selectedIndustries.filter(i => i !== industry);
    setSelectedIndustries(updated);
    
    onFiltersChange({
      searchTerm,
      industries: updated,
      compliance: selectedCompliance,
      dataTypes: selectedDataTypes,
      agenticVerified
    });
  };

  const handleComplianceChange = (comp: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedCompliance, comp]
      : selectedCompliance.filter(c => c !== comp);
    setSelectedCompliance(updated);
    
    onFiltersChange({
      searchTerm,
      industries: selectedIndustries,
      compliance: updated,
      dataTypes: selectedDataTypes,
      agenticVerified
    });
  };

  const handleDataTypeChange = (dataType: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedDataTypes, dataType]
      : selectedDataTypes.filter(d => d !== dataType);
    setSelectedDataTypes(updated);
    
    onFiltersChange({
      searchTerm,
      industries: selectedIndustries,
      compliance: selectedCompliance,
      dataTypes: updated,
      agenticVerified
    });
  };

  const handleAgenticVerifiedChange = (checked: boolean) => {
    setAgenticVerified(checked);
    onFiltersChange({
      searchTerm,
      industries: selectedIndustries,
      compliance: selectedCompliance,
      dataTypes: selectedDataTypes,
      agenticVerified: checked
    });
  };

  return (
    <section className="py-8 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <input
              type="text"
              placeholder="Search by tool name, vendor, compliance certification, or feature"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal bg-background text-foreground"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Industry</label>
                <div className="space-y-2">
                  {industries.map((industry) => (
                    <label key={industry} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIndustries.includes(industry)}
                        onChange={(e) => handleIndustryChange(industry, e.target.checked)}
                        className="rounded border-border text-brand-teal focus:ring-brand-teal/20" 
                      />
                      <span className="ml-2 text-sm text-muted-foreground">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compliance Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Compliance Status</label>
                <div className="space-y-2">
                  {compliance.map((comp) => (
                    <label key={comp} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedCompliance.includes(comp)}
                        onChange={(e) => handleComplianceChange(comp, e.target.checked)}
                        className="rounded border-border text-brand-teal focus:ring-brand-teal/20" 
                      />
                      <span className="ml-2 text-sm text-muted-foreground">{comp}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Types Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Data Types</label>
                <div className="space-y-2">
                  {dataTypes.map((type) => (
                    <label key={type} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedDataTypes.includes(type)}
                        onChange={(e) => handleDataTypeChange(type, e.target.checked)}
                        className="rounded border-border text-brand-teal focus:ring-brand-teal/20" 
                      />
                      <span className="ml-2 text-sm text-muted-foreground">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Agentic Verified */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Agentic Verified
                  <span className="inline-block ml-1 text-brand-teal">🪶</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={agenticVerified}
                    onCheckedChange={handleAgenticVerifiedChange}
                  />
                  <span className="text-sm text-muted-foreground">
                    Only show agentic verified tools
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketplaceSearch;
