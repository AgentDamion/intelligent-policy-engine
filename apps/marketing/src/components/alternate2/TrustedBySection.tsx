import React from 'react';
import { alternate2Content } from '@/content/alternate2Landing';

export function TrustedBySection() {
  const { trustSignals } = alternate2Content;

  // Company logos as placeholder rectangles with company names
  const companies = [
    'Pfizer', 'Novartis', 'Johnson & Johnson', 
    'Ogilvy', 'Publicis', 'WPP'
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {trustSignals.header}
          </h2>
        </div>

        {/* Logo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center mb-8">
          {companies.map((company, index) => (
            <div 
              key={index}
              className="w-24 h-12 bg-muted border rounded-lg flex items-center justify-center opacity-60 hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-medium text-muted-foreground text-center px-2">
                {company}
              </span>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="text-center">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {trustSignals.copy}
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {trustSignals.signals.map((signal, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-foreground">{signal}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}