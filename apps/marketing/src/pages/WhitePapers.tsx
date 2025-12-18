import { useState, useEffect } from "react";
import NewFooter from "@/components/NewFooter";
import { WhitePaperCard } from "@/components/marketing/WhitePaperCard";
import { WhitePaperLeadForm } from "@/components/marketing/WhitePaperLeadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";
import {
  whitePapers,
  type WhitePaper,
} from "@/data/whitePapers";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import WhitePaperHero from "@/components/white-papers/WhitePaperHero";
import WhyCareBullets from "@/components/white-papers/WhyCareBullets";
import TrilogySection from "@/components/white-papers/TrilogySection";
import ProofCenterPreview from "@/components/white-papers/ProofCenterPreview";
import SocialProofSection from "@/components/white-papers/SocialProofSection";
import RiskCascadeSection from "@/components/white-papers/RiskCascadeSection";
import FAQSection from "@/components/white-papers/FAQSection";
import AdvancedSections from "@/components/white-papers/AdvancedSections";
import ConversionFunnelSection from "@/components/white-papers/ConversionFunnelSection";
import { trackEvent, Events } from "@/utils/analytics";
import '@/styles/white-papers.css';

const WhitePapers = () => {
  const [selectedWhitePaper, setSelectedWhitePaper] = useState<WhitePaper | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const handleDownloadClick = (whitePaper: WhitePaper) => {
    setSelectedWhitePaper(whitePaper);
    setIsFormOpen(true);
  };

  // Capture UTM parameters on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmData = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      persona: params.get('persona'),
      timestamp: new Date().toISOString()
    };
    
    if (utmData.source || utmData.campaign) {
      localStorage.setItem('leadSource', JSON.stringify(utmData));
    }
  }, []);

  // Track scroll depth
  useEffect(() => {
    let tracked75 = false;
    
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercent > 75 && !tracked75) {
        trackEvent(Events.SCROLL_75, { page: 'white-papers' });
        tracked75 = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter white papers
  const filteredWhitePapers = whitePapers.filter((wp) => {
    const matchesSearch =
      searchQuery === "" ||
      wp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wp.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || wp.category === selectedCategory;

    const matchesIndustry =
      !selectedIndustry ||
      wp.industry === selectedIndustry ||
      wp.industry === "all";

    return matchesSearch && matchesCategory && matchesIndustry;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Section 1: Navigation */}
      <MarketingHeader />
      
      {/* Section 2: Hero (Above Fold) - OPTIMIZED */}
      <WhitePaperHero />
      
      {/* Section 3: The Trilogy (Featured Resources) - MOVED UP */}
      <TrilogySection />
      
      {/* Section 4: Proof Center Preview (NEW) */}
      <ProofCenterPreview />
      
      {/* Section 5: Social Proof (NEW) */}
      <SocialProofSection />
      
      {/* Section 6: Why Care Bullets (NEW - replaces full Urgency) */}
      <WhyCareBullets />
      
      {/* Section 7: Risk Cascade (Problem Validation) */}
      <RiskCascadeSection />
      
      {/* Section 8: FAQ (NEW) */}
      <FAQSection />
      
      {/* Section 9: Conversion Funnel (Tiered CTAs) */}
      <ConversionFunnelSection />
      
      {/* Section 10: Advanced Sections (Accordion) */}
      <AdvancedSections />
      
      {/* Section 8: All Resources (Existing functionality) */}
      <section id="all-resources" className="py-16 px-6 bg-background">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">All White Papers</h2>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search white papers..."
              className="pl-12 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Filter by Category:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "compliance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("compliance")}
                >
                  Compliance
                </Button>
                <Button
                  variant={selectedCategory === "roi" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("roi")}
                >
                  ROI
                </Button>
                <Button
                  variant={selectedCategory === "risk-management" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("risk-management")}
                >
                  Risk Management
                </Button>
                <Button
                  variant={selectedCategory === "best-practices" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("best-practices")}
                >
                  Best Practices
                </Button>
                <Button
                  variant={selectedCategory === "frameworks" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("frameworks")}
                >
                  Frameworks
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Filter by Industry:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedIndustry === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry(null)}
                >
                  All Industries
                </Button>
                <Button
                  variant={selectedIndustry === "pharmaceutical" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry("pharmaceutical")}
                >
                  Pharmaceutical
                </Button>
                <Button
                  variant={selectedIndustry === "marketing-services" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry("marketing-services")}
                >
                  Marketing & Agencies
                </Button>
                <Button
                  variant={selectedIndustry === "financial" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry("financial")}
                >
                  Financial Services
                </Button>
                <Button
                  variant={selectedIndustry === "healthcare" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry("healthcare")}
                >
                  Healthcare
                </Button>
              </div>
            </div>
          </div>

          {/* White Papers Grid - LIMITED TO 6 */}
          {filteredWhitePapers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredWhitePapers.slice(0, 6).map((whitePaper) => (
                  <WhitePaperCard
                    key={whitePaper.id}
                    whitePaper={whitePaper}
                  onDownloadClick={handleDownloadClick}
                />
              ))}
            </div>
            {filteredWhitePapers.length > 6 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  View All {filteredWhitePapers.length} Resources →
                </Button>
              </div>
            )}
          </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No white papers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </section>

      <NewFooter />

      {/* Lead Form Modal */}
      <WhitePaperLeadForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        whitePaper={selectedWhitePaper}
      />
    </div>
  );
};

export default WhitePapers;
