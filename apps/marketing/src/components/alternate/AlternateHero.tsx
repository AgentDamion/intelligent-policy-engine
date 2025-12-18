import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';
import VideoModal from '@/components/common/VideoModal';
const AlternateHero = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  return <>
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-brand-warm-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
              Accelerate <span className="text-brand-teal">AI Tool Approvals</span> from{' '}
              <span className="text-brand-coral">Weeks to Days</span>
              {' '}—With Verifiable Governance Proof
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">Human-in-the-loop—people decide; platform documents and orchestrates. Cut approval time by 10.7x while maintaining perfect regulatory compliance. Every tool. Every vendor. Every decision.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-primary-foreground px-8 py-4 text-lg font-semibold">
                <Link to={routes.contact}>Request Beta Access</Link>
              </Button>
              
              <Button size="lg" variant="outline" onClick={() => setIsVideoOpen(true)} className="border-border hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold">
                <Play className="w-5 h-5 mr-2" />
                Calculate Your Savings
              </Button>
            </div>
          </div>
        </div>
      </section>

      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} title="2-Minute Demo Video" />
    </>;
};
export default AlternateHero;