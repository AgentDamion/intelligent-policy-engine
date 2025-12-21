import React from 'react';

export const TestimonialSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md flex items-center justify-center mx-auto mb-8 border border-primary/20">
          <span className="text-xl font-bold text-gray-700">V</span>
        </div>
        
        <blockquote className="text-2xl lg:text-3xl font-medium text-foreground leading-relaxed mb-8 font-manifesto italic">
          "Our audit response time went from weeks to days."
        </blockquote>
        
        <cite className="text-sm text-muted-foreground not-italic">
          — Enterprise Compliance Lead, Governance Lab
        </cite>
      </div>
    </section>
  );
};

export default TestimonialSection;



