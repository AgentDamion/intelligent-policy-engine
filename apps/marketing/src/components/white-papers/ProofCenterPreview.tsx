import { Button } from '@/components/ui/button';
import { trackEvent, Events } from '@/utils/analytics';

const ProofCenterPreview = () => {
  const handleDemoClick = () => {
    trackEvent(Events.DEMO_CLICK, { location: 'proof-center-preview' });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12">
          See the Platform That Powers This Framework
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {/* Using platform-stack as placeholder for dashboard */}
            <picture>
              <source srcSet="/images/platform-stack.webp" type="image/webp" />
              <img 
                src="/images/platform-stack.png" 
                alt="Live governance dashboard showing real-time policy decisions with Allow/Block/Route verdicts and validation metadata"
                className="w-full max-w-[720px] rounded-lg shadow-xl"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <p className="text-sm text-gray-600 mt-3 text-center">
              Real-time decision stream with policy verdicts
            </p>
          </div>
          <div>
            {/* Using cascading-failure as placeholder for proof bundle */}
            <picture>
              <source srcSet="/images/cascading-failure.webp" type="image/webp" />
              <img 
                src="/images/cascading-failure.png" 
                alt="Exportable proof bundle with cryptographic signatures, tamper-evident validation chain, and FDA-ready audit trail"
                className="w-full max-w-[720px] rounded-lg shadow-xl"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <p className="text-sm text-gray-600 mt-3 text-center">
              Tamper-evident proof bundle ready for FDA audit
            </p>
          </div>
        </div>
        <div className="text-center mt-8">
          <Button 
            size="lg" 
            className="bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white"
            onClick={handleDemoClick}
          >
            Watch 2-Minute Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProofCenterPreview;
