const SocialProofSection = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-xl font-bold mb-4">Trusted by Compliance Leaders At:</h4>
            <div className="grid grid-cols-3 gap-4 opacity-60 mb-6">
              {/* Logo placeholders - grayscale */}
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">Client Logo</span>
              </div>
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">Client Logo</span>
              </div>
              <div className="h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">Client Logo</span>
              </div>
            </div>
            <blockquote className="mt-6 italic text-gray-700 text-lg border-l-4 border-[hsl(var(--brand-teal))] pl-4">
              "We went from 3-week evidence assembly to 15 minutes. Game changer for MLR velocity."
            </blockquote>
            <p className="text-sm text-gray-500 mt-2 pl-4">
              — Head of Regulatory Affairs, Top 10 Pharma
            </p>
          </div>
          <div>
            {/* Using maturity-model as placeholder for KPI trendlines */}
            <picture>
              <source srcSet="/images/maturity-model.webp" type="image/webp" />
              <img 
                src="/images/maturity-model.png" 
                alt="Adoption and compliance metrics trending upward showing continuous improvement"
                className="w-full max-w-[480px] mx-auto"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
