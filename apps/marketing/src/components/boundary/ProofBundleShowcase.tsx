import React from 'react';
import { Check } from 'lucide-react';
import { howItWorksContent } from '@/content/howItWorksContent';

export const ProofBundleShowcase = () => {
  const { proofBundle } = howItWorksContent;
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(220,70%,35%)] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Proof Bundle Card */}
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold tracking-wider uppercase mb-4 text-white/70">
              {proofBundle.eyebrow}
            </p>
            
            <div className="bg-white text-foreground rounded-lg p-6 shadow-xl">
              <h3 className="font-bold text-lg mb-4">
                {proofBundle.sample.title}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Actor + agency</p>
                  <p className="font-medium">{proofBundle.sample.actor}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">Brand + Audience</p>
                  <p className="font-medium">{proofBundle.sample.brand}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">AI policy</p>
                  <p className="font-medium">{proofBundle.sample.policy}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">On</p>
                  <p className="font-medium">{proofBundle.sample.timestamp}</p>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Config</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {proofBundle.sample.config.inputs}
                    </span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {proofBundle.sample.config.outputs}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4 italic text-right">
                Hash + timestamped
              </p>
            </div>
          </div>
          
          {/* Right: Benefits List */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 font-solution">
              {proofBundle.headline}
            </h2>
            
            <ul className="space-y-4 mb-8">
              {proofBundle.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 text-primary mt-1" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            
            <p className="text-sm italic text-white/80 mb-2">
              {proofBundle.footer}
            </p>
            
            <p className="text-xs text-white/60">
              {proofBundle.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
