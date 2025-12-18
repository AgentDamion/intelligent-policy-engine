import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { alternate2ContentNew } from '@/content/alternate2LandingNew';

export function NewFinalCTASection() {
  const { finalCTA } = alternate2ContentNew;

  return (
    <section className="py-20 bg-mint-50">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-700">
            {finalCTA.header}
          </h2>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            {finalCTA.subheader}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 py-6 text-base rounded-2xl">
              {finalCTA.cta.primary.text}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button variant="outline" size="lg" className="border-slate-700 text-slate-700 hover:bg-slate-50 px-8 py-6 text-base rounded-2xl">
              {finalCTA.cta.secondary.text}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}