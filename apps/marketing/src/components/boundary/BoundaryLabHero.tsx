import { Button } from "@/components/ui/button";
import { boundaryLabContent } from "@/content/boundaryLabContent";
import { trackEvent } from "@/utils/analytics";

interface BoundaryLabHeroProps {
  onDownloadPackClick: () => void;
}

export const BoundaryLabHero = ({ onDownloadPackClick }: BoundaryLabHeroProps) => {
  const { hero } = boundaryLabContent;

  const handlePrimaryClick = () => {
    trackEvent('boundary_lab_pack_clicked', {
      source: 'hero',
      cta_text: hero.primaryCTA.text
    });
    onDownloadPackClick();
  };

  const handleSecondaryClick = () => {
    trackEvent('boundary_lab_book_session_clicked', {
      source: 'hero',
      cta_text: hero.secondaryCTA.text
    });
  };

  return (
    <section className="bg-gray-50 px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4">
          {hero.breadcrumb}
        </p>
        
        <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 font-solution">
          {hero.headline}
        </h1>
        
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-8">
          {hero.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90"
            onClick={handlePrimaryClick}
          >
            {hero.primaryCTA.text}
          </Button>
          
          <Button 
            asChild
            variant="outline" 
            size="lg"
            onClick={handleSecondaryClick}
          >
            <a href={hero.secondaryCTA.href}>
              {hero.secondaryCTA.text}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
