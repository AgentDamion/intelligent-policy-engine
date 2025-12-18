import React from 'react';
import { howItWorksContent } from '@/content/howItWorksContent';

export const FlowDiagram = () => {
  const { flow } = howItWorksContent;
  
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 font-solution">
          {flow.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-border -z-10" />
          
          {flow.steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center text-center relative">
              {/* Number Badge */}
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold mb-4 animate-pulse">
                {step.number}
              </div>
              
              <h3 className="text-xl font-bold mb-2 font-solution">
                {step.title}
              </h3>
              
              <p className="text-sm text-muted-foreground max-w-xs">
                {step.description}
              </p>
              
              {/* Connecting arrow for mobile */}
              {index < flow.steps.length - 1 && (
                <div className="md:hidden w-0.5 h-8 bg-border my-4" />
              )}
            </div>
          ))}
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-12 italic">
          {flow.footer}
        </p>
      </div>
    </section>
  );
};
