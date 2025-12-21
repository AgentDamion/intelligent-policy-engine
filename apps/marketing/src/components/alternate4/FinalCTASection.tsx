import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FinalCTASection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 font-solution">
          Ready to close the ungoverned seam?
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the Governance Lab — early adopters shaping the future of AI governance at the 
          enterprise-partner boundary.
        </p>

        <div className="bg-muted/50 rounded-2xl p-8 max-w-xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Pilot starts within 2 weeks. 30-day access. Up to 3 partners.</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/founding-partners">
                Request Pilot Access <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/book-demo">
                Book a Demo
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          We match your requirements. Hands-on enterprise/partner onboarding included.
        </p>
      </div>
    </section>
  );
};

export default FinalCTASection;



