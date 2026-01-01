import React, { useState, useEffect, useMemo } from 'react';
import { BoundaryNav } from '@/components/boundary/BoundaryNav';
import { BoundaryFooter } from '@/components/boundary/BoundaryFooter';
import { IndustryFilterTabs } from '@/components/workflows/IndustryFilterTabs';
import { WorkflowTemplateCard } from '@/components/workflows/WorkflowTemplateCard';
import { RequestCustomTemplateModal } from '@/components/workflows/RequestCustomTemplateModal';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { workflowTemplates } from '@/data/workflowTemplates';
import { toast } from 'sonner';

const WorkflowLibrary = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Workflow Intelligence Library | AIComplyr';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Pre-mapped AI governance workflows for regulated industries. See where AI risk lives before you build policy around it.'
      );
    }
  }, []);

  const filteredWorkflows = useMemo(() => {
    if (selectedIndustry === 'all') {
      return workflowTemplates;
    }
    return workflowTemplates.filter(
      w => w.industry === selectedIndustry || w.industry === 'all'
    );
  }, [selectedIndustry]);

  const handleViewTemplate = (id: string) => {
    // In a real app, this would navigate to a template detail page
    toast.info(`Template details for ${id} coming soon!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BoundaryNav />
      
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 font-solution">
              Workflow Intelligence Library
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Pre-mapped AI governance workflows for regulated industries.
            </p>
            <p className="text-base text-muted-foreground">
              See where AI risk lives before you build policy around it.
            </p>
          </div>
        </section>

        {/* Industry Filter */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <IndustryFilterTabs
              selectedIndustry={selectedIndustry}
              onSelectIndustry={setSelectedIndustry}
            />
          </div>
        </section>

        {/* Workflow Cards Grid */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkflows.map((workflow) => (
                <WorkflowTemplateCard
                  key={workflow.id}
                  workflow={workflow}
                  onViewTemplate={handleViewTemplate}
                />
              ))}
            </div>

            {filteredWorkflows.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No workflows found for this industry. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Request Custom Template CTA */}
        <section className="px-4 sm:px-6 lg:px-8 border-t border-border pt-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Don't see your workflow?
            </h2>
            <p className="text-muted-foreground mb-6">
              We can map any AI governance workflow for your specific use case.
            </p>
            <Button 
              size="lg"
              className="rounded-full gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <MessageSquare className="w-4 h-4" />
              Request Custom Template
            </Button>
          </div>
        </section>
      </main>

      <BoundaryFooter />

      <RequestCustomTemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default WorkflowLibrary;











