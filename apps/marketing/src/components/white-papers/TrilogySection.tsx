import React from 'react';
import { trilogyPapers } from '@/data/whitePapers';
import { trackEvent, Events } from '@/utils/analytics';

const TrilogySection = () => {
  const coverImages = {
    1: '/images/trilogy-covers.png', // Will be cropped/positioned
    2: '/images/trilogy-covers.png',
    3: '/images/trilogy-covers.png'
  };

  return (
    <section id="trilogy" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            The Three-Paper Prevention Framework
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Each paper addresses one layer of the cascading risk—together, 
            they form complete governance infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {trilogyPapers.map((paper) => (
            <div 
              key={paper.id} 
              className={`${
                paper.number === 3 
                  ? 'bg-amber-50 border-2 border-amber-300 shadow-xl' 
                  : 'bg-gray-50 border border-gray-200'
              } rounded-lg p-6 hover:shadow-xl transition`}
            >
              
              {/* Header with small thumbnail */}
              <div className="flex items-start gap-4 mb-4">
                {/* Small cover thumbnail placeholder */}
                <div className={`w-20 h-28 rounded shadow-md flex-shrink-0 ${
                  paper.number === 1 ? 'bg-slate-900' : 
                  paper.number === 2 ? 'bg-[hsl(var(--brand-teal))]' : 
                  'bg-amber-600'
                } flex items-center justify-center text-white text-xs font-bold`}>
                  WP#{paper.number}
                </div>
                
                {/* Title info on right */}
                <div className="flex-1">
                  <span className={`inline-block ${
                    paper.number === 1 ? 'bg-slate-900' :
                    paper.number === 2 ? 'bg-[hsl(var(--brand-teal))]' :
                    'bg-amber-600'
                  } text-white text-xs px-3 py-1 rounded-full font-semibold mb-2 uppercase`}>
                    {paper.badge}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {paper.subtitle}
                  </p>
                </div>
              </div>

              {/* Prevents */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {paper.number === 3 ? 'Delivers:' : 'Prevents:'}
                </p>
                <p className="text-sm text-gray-600">{paper.prevents}</p>
              </div>

              {/* Key Frameworks */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Key Frameworks:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {paper.frameworks.map((framework, idx) => (
                    <li key={idx}>• {framework}</li>
                  ))}
                </ul>
              </div>

              {/* Social proof */}
              <div className={`mb-4 pb-4 ${
                paper.number === 3 ? 'border-b border-amber-200' : 'border-b border-gray-200'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">{paper.downloads.toLocaleString()}</span>
                  <span className="text-gray-500">downloads</span>
                </div>
                <p className="text-xs text-gray-600 italic mt-1">
                  {paper.number === 1 ? '"Finally, governance that doesn\'t kill velocity."' :
                   paper.number === 2 ? '"The multi-client framework we needed."' :
                   '"Audit log = new currency of credibility."'}
                </p>
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <button 
                  className={`w-full ${
                    paper.number === 3 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90'
                  } text-white py-3 rounded-lg transition font-semibold`}
                  onClick={() => {
                    trackEvent(Events.WP_CARD_CLICK, { 
                      wp_id: paper.id,
                      wp_number: paper.number,
                      location: 'trilogy-section'
                    });
                    window.open(paper.pdfPath, '_blank');
                  }}
                >
                  Download Paper #{paper.number}
                </button>
                <a 
                  href="#" 
                  className={`block text-center text-sm ${
                    paper.number === 3 ? 'text-amber-700' : 'text-[hsl(var(--brand-teal))]'
                  } hover:underline`}
                >
                  Preview first 5 pages →
                </a>
              </div>

            </div>
          ))}

        </div>

        {/* Bundle CTA */}
        <div className="bg-teal-50 rounded-xl p-8 text-center border-2 border-teal-200">
          <h4 className="text-2xl font-bold mb-2 text-gray-900">
            Or Get the Complete Prevention Framework
          </h4>
          <p className="text-gray-600 mb-6">
            Download all three papers plus implementation checklist
          </p>
          <button 
            className="bg-[hsl(var(--brand-teal))] text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-[hsl(var(--brand-teal))]/90 transition"
            onClick={() => {
              trackEvent(Events.CTA_CLICK, { 
                button_id: 'trilogy-bundle',
                location: 'trilogy-section'
              });
              window.open('/pdfs/trilogy-bundle.pdf', '_blank');
            }}
          >
            Download All 3 Papers (78 pages)
          </button>
          <p className="text-sm text-gray-500 mt-3">
            PDF • No email required • Instant access
          </p>
          <p className="text-xs text-gray-500 mt-2">
            <span className="text-green-600 font-semibold">↑ +847 downloads</span> in last 30 days
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrilogySection;
