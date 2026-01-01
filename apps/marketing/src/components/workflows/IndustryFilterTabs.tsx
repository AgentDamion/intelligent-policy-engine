import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { industries } from '@/data/workflowTemplates';

interface IndustryFilterTabsProps {
  selectedIndustry: string;
  onSelectIndustry: (industry: string) => void;
}

export const IndustryFilterTabs = ({
  selectedIndustry,
  onSelectIndustry
}: IndustryFilterTabsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
      {industries.map((industry) => (
        <Button
          key={industry.id}
          variant={selectedIndustry === industry.id ? "default" : "outline"}
          size="sm"
          className={`rounded-full gap-2 ${!industry.available ? 'opacity-60' : ''}`}
          onClick={() => industry.available && onSelectIndustry(industry.id)}
          disabled={!industry.available}
        >
          {industry.icon && <span>{industry.icon}</span>}
          {industry.label}
          {!industry.available && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              Soon
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

export default IndustryFilterTabs;











