import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { alternate2Content } from '@/content/alternate2Landing';

export function ClosingConversionSection() {
  const { closingConversion } = alternate2Content;

  return (
    <section className="py-20 bg-brand-teal/5 border-t">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {closingConversion.headline}
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            {closingConversion.deck}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8 py-6">
              {closingConversion.cta.primary} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button variant="outline" size="lg" className="text-base px-8 py-6">
              {closingConversion.cta.secondary} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}