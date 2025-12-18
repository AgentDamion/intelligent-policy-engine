import React, { useState, useEffect } from 'react';
import { BoundaryNav } from '@/components/boundary/BoundaryNav';
import { BoundaryFooter } from '@/components/boundary/BoundaryFooter';
import { BoundaryLabHero } from '@/components/boundary/BoundaryLabHero';
import { FeaturedPackSection } from '@/components/boundary/FeaturedPackSection';
import { AudienceResourceSection } from '@/components/boundary/AudienceResourceSection';
import { WhitePaperLeadForm } from '@/components/marketing/WhitePaperLeadForm';
import { Button } from '@/components/ui/button';
import { boundaryLabContent } from '@/content/boundaryLabContent';
import { trilogyPapers } from '@/data/whitePapers';
import { trackEvent } from '@/utils/analytics';
import type { WhitePaper } from '@/data/whitePapers';

const BoundaryLab = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WhitePaper | null>(null);
  const [isPackDownload, setIsPackDownload] = useState(false);

  useEffect(() => {
    document.title = 'Boundary Lab | AIComplyr - Frameworks for AI Governance';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'White papers, playbooks, and tools that turn AI tool chaos into executable policy and audit-ready proof.'
      );
    }

    // Track scroll depth
    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll > 75 && maxScroll < 80) {
          trackEvent('scroll_75', { page: 'boundary_lab' });
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownloadPackClick = () => {
    setIsPackDownload(true);
    // Create a fake WhitePaper object for the pack
    setSelectedResource({
      id: 'trilogy-pack',
      title: 'Three-Paper Prevention Framework Pack',
      description: 'Complete governance infrastructure across all three layers of cascading risk.',
      category: 'frameworks',
      industry: 'all',
      author: 'AIComplyr Governance Team',
      publishDate: '2024',
      coverImage: '/images/trilogy-covers.png',
      keyTakeaways: [
        'Executable policy framework',
        'AI supply chain visibility',
        'Cryptographic proof layer'
      ]
    } as WhitePaper);
    setIsFormOpen(true);
  };

  const handleResourceDownloadClick = (resource: any) => {
    setIsPackDownload(false);
    // Convert resource to WhitePaper format
    setSelectedResource({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      category: 'frameworks',
      industry: 'all',
      author: 'AIComplyr',
      publishDate: '2024',
      coverImage: '/images/white-paper-placeholder.png',
      keyTakeaways: []
    } as WhitePaper);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedResource(null);
    setIsPackDownload(false);
  };

  // Custom handler for after lead form submission
  const handleFormSubmitSuccess = () => {
    if (isPackDownload) {
      // Open all three trilogy PDFs
      trilogyPapers.forEach((paper, index) => {
        setTimeout(() => {
          window.open(paper.pdfPath, '_blank');
        }, index * 500); // Stagger openings by 500ms
      });
    } else if (selectedResource) {
      // Open single PDF - we need to find the actual resource
      const allResources = boundaryLabContent.audienceSections.flatMap(s => s.resources);
      const resource = allResources.find(r => r.id === selectedResource.id);
      if (resource?.pdfPath) {
        window.open(resource.pdfPath, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BoundaryNav />
      
      <main>
        <BoundaryLabHero onDownloadPackClick={handleDownloadPackClick} />
        
        <FeaturedPackSection onDownloadPackClick={handleDownloadPackClick} />
        
        {boundaryLabContent.audienceSections.map((section, index) => (
          <AudienceResourceSection
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.description}
            resources={section.resources}
            onDownloadClick={handleResourceDownloadClick}
            bgColor={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
          />
        ))}

        {/* Bottom CTA Section */}
        <section className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4 font-solution text-foreground">
              {boundaryLabContent.bottomCTA.headline}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {boundaryLabContent.bottomCTA.description}
            </p>
            <Button 
              asChild
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => trackEvent('boundary_lab_bottom_cta_clicked', { source: 'bottom_section' })}
            >
              <a href={boundaryLabContent.bottomCTA.ctaHref}>
                {boundaryLabContent.bottomCTA.ctaText}
              </a>
            </Button>
          </div>
        </section>
      </main>
      
      <BoundaryFooter />

      <WhitePaperLeadForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        whitePaper={selectedResource}
        onSuccess={handleFormSubmitSuccess}
      />
    </div>
  );
};

export default BoundaryLab;
