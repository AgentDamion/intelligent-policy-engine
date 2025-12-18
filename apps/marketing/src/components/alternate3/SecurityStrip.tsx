import React, { useEffect, useRef } from 'react';
import { Shield, Lock, FileCheck, UserCheck } from 'lucide-react';

export const SecurityStrip = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            window.dispatchEvent(new CustomEvent('analytics', {
              detail: { event: 'security_strip_seen' }
            }));
            hasTracked.current = true;
          }
        });
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const securityFeatures = [
    {
      icon: Shield,
      text: "Data minimization: evidence pointers over raw content"
    },
    {
      icon: Lock,
      text: "Scoped access: Partners see only assigned Projects"
    },
    {
      icon: FileCheck,
      text: "Tamper-evident: signed Proof Bundles with hashes"
    },
    {
      icon: UserCheck,
      text: "SSO & MFA: enterprise-ready authentication"
    }
  ];

  return (
    <section ref={sectionRef} className="py-16 lg:py-20 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-foreground">
          Built for regulated teams
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-teal/10 mb-3">
                  <Icon className="w-6 h-6 text-brand-teal" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
