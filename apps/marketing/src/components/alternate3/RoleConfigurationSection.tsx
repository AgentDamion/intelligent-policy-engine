import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Check } from 'lucide-react';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const RoleConfigurationSection = () => {
  const { roleConfiguration } = alternate3Content;
  const sectionRef = useRef<HTMLElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            window.dispatchEvent(new CustomEvent('analytics', {
              detail: { event: 'observer_benefit_seen' }
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

  const iconMap = {
    building: Building2,
    users: Users
  };

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            {roleConfiguration.sectionTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {roleConfiguration.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roleConfiguration.columns.map((column, index) => {
            const Icon = iconMap[column.icon as keyof typeof iconMap];
            
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-brand-teal/10">
                      <Icon className="w-6 h-6 text-brand-teal" />
                    </div>
                    <CardTitle className="text-xl">
                      {column.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {column.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
