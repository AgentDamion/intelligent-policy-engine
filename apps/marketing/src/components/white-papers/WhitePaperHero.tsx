import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { detectPersona, getPersonaConfig } from '@/utils/personalization';
import { trackEvent, Events } from '@/utils/analytics';
import { useEffect } from 'react';

const WhitePaperHero = () => {
  const navigate = useNavigate();
  const persona = detectPersona();
  const config = getPersonaConfig(persona);

  // Preload hero image for LCP improvement
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/images/proof-layer-hero-solid.png';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const scrollToUrgency = () => {
    document.getElementById('urgency')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBundleDownload = () => {
    trackEvent(Events.CTA_CLICK, { 
      button_id: 'hero-bundle-primary',
      persona,
      location: 'hero'
    });
    // Download all 3 papers
    window.open('/pdfs/trilogy-bundle.pdf', '_blank');
  };

  const handleSecondaryCTA = () => {
    trackEvent(Events.CTA_CLICK, { 
      button_id: 'hero-secondary',
      persona,
      location: 'hero',
      cta_text: config.secondaryCTA
    });
    
    if (persona === 'agency') {
      // Preview compliance certificate
      window.open('/compliance-certificate', '_blank');
    } else {
      // Go to contact page
      navigate('/contact');
    }
  };

  return (
    <>
      <section 
        className="section--hero hero relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headline + CTAs */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Respond to FDA Audit Requests in Minutes, Not Weeks
              </h1>
              
              <p className="text-lg lg:text-xl text-white/90 mb-4 max-w-2xl">
                Portable proof bundles + executable policy = audit-ready evidence on demand across enterprise–agency workflows.
              </p>
              
              <p className="text-sm text-white/70 mb-8 max-w-2xl">
                For Chief Compliance Officers, Heads of MLR/Regulatory, and Agency COOs.
              </p>
              
              {/* Two Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Button 
                  onClick={handleBundleDownload}
                  className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                  size="lg"
                >
                  Get the 3-Paper Bundle (PDF)
                </Button>
                <Button 
                  onClick={handleSecondaryCTA}
                  className="bg-brand-orange text-black hover:bg-brand-orange/90 px-8 py-6 text-lg font-semibold"
                  size="lg"
                >
                  {config.secondaryCTA}
                </Button>
              </div>
              
              <p className="text-xs text-white/60">
                PDF • No email required • Instant access
              </p>
              
              {/* Scroll indicator */}
              <button
                onClick={scrollToUrgency}
                className="mt-8 text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                See why this matters now
                <span className="text-lg">↓</span>
              </button>
            </div>

            {/* Right Column: Hero Visual */}
            <div className="flex justify-center lg:justify-end items-center min-h-[300px] relative z-20 -mr-4 lg:-mr-8">
              <picture>
                <img
                  src="/images/proof-layer-hero-solid.png"
                  alt="Proof Layer Stack: Policy Runtime → Validation Orchestration → Proof Bundle with tamper-evident seals"
                  className="w-full h-auto object-contain drop-shadow-2xl scale-105"
                  width={1280}
                  height={853}
                  loading="eager"
                  decoding="async"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    console.info("Hero image loaded", {
                      src: img.currentSrc || img.src,
                      naturalWidth: img.naturalWidth,
                      naturalHeight: img.naturalHeight,
                      clientRect: img.getBoundingClientRect()
                    });
                  }}
                  onError={(e) => {
                    console.error("Hero image failed to load, swapping to fallback", e.currentTarget.src);
                    e.currentTarget.src = "/images/proof-layer-hero-1280.png";
                  }}
                />
              </picture>
            </div>

          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA Bar */}
      <div className="sticky-cta lg:hidden">
        <button 
          onClick={handleBundleDownload}
          className="bg-white text-slate-900 hover:bg-gray-100"
          onKeyDown={(e) => e.key === 'Enter' && handleBundleDownload()}
        >
          Get 3-Paper Bundle
        </button>
        <button 
          onClick={handleSecondaryCTA}
          className="bg-brand-orange text-black hover:bg-brand-orange/90"
          onKeyDown={(e) => e.key === 'Enter' && handleSecondaryCTA()}
        >
          {persona === 'agency' ? 'Certificate' : 'Governance Lab'}
        </button>
      </div>
    </>
  );
};

export default WhitePaperHero;
