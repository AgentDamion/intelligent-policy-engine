import { Button } from "@/components/ui/button";
import { trilogyPapers } from "@/data/whitePapers";
import { boundaryLabContent } from "@/content/boundaryLabContent";
import { trackEvent } from "@/utils/analytics";
import { Download } from "lucide-react";

interface FeaturedPackSectionProps {
  onDownloadPackClick: () => void;
}

export const FeaturedPackSection = ({ onDownloadPackClick }: FeaturedPackSectionProps) => {
  const { featuredPack } = boundaryLabContent;

  const handleDownloadClick = () => {
    trackEvent('boundary_lab_pack_clicked', {
      source: 'featured_section',
      cta_text: featuredPack.ctaText
    });
    onDownloadPackClick();
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground font-solution">
            {featuredPack.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {featuredPack.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {trilogyPapers.map((paper) => (
            <div 
              key={paper.id} 
              className={`${
                paper.number === 3 
                  ? 'bg-amber-50 border-2 border-amber-300 shadow-xl' 
                  : 'bg-card border border-border'
              } rounded-lg p-6 hover:shadow-xl transition`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-20 h-28 rounded shadow-md flex-shrink-0 ${
                  paper.number === 1 ? 'bg-slate-900' : 
                  paper.number === 2 ? 'bg-[hsl(var(--brand-teal))]' : 
                  'bg-amber-600'
                } flex items-center justify-center text-white text-xs font-bold`}>
                  WP#{paper.number}
                </div>
                
                <div className="flex-1">
                  <span className={`inline-block ${
                    paper.number === 1 ? 'bg-slate-900' :
                    paper.number === 2 ? 'bg-[hsl(var(--brand-teal))]' :
                    'bg-amber-600'
                  } text-white text-xs px-3 py-1 rounded-full font-semibold mb-2 uppercase`}>
                    {paper.badge}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {paper.subtitle}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {paper.number === 3 ? 'Delivers:' : 'Prevents:'}
                </p>
                <p className="text-sm text-muted-foreground">{paper.prevents}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-2">Key Frameworks:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {paper.frameworks.map((framework, idx) => (
                    <li key={idx}>• {framework}</li>
                  ))}
                </ul>
              </div>

              <div className={`mb-4 pb-4 ${
                paper.number === 3 ? 'border-b border-amber-200' : 'border-b border-border'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{paper.downloads.toLocaleString()}</span>
                  <span className="text-muted-foreground">downloads</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={handleDownloadClick}
          >
            <Download className="h-4 w-4" />
            {featuredPack.ctaText}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            {featuredPack.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
};
