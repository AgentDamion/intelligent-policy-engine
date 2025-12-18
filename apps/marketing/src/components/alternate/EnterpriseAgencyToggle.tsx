import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { enterpriseAgencyContent } from '@/content/enterpriseAgencyContent';
import { 
  Building2, 
  Users, 
  FileText, 
  Shield, 
  CheckCircle,
  FileStack,
  Clock,
  Trophy,
  Target,
  LucideIcon
} from 'lucide-react';

type Persona = 'enterprise' | 'agency';

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Users,
  FileText,
  Shield,
  CheckCircle,
  FileStack,
  Clock,
  Trophy,
  Target
};

export default function EnterpriseAgencyToggle() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>('enterprise');
  const content = enterpriseAgencyContent[selectedPersona];
  const isEnterprise = selectedPersona === 'enterprise';

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-6">{enterpriseAgencyContent.header}</h2>
          
          {/* Toggle */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center bg-muted rounded-full p-1">
              <button
                onClick={() => setSelectedPersona('enterprise')}
                className={cn(
                  "px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200",
                  isEnterprise
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="inline-block w-4 h-4 mr-2" />
                Enterprise
              </button>
              <button
                onClick={() => setSelectedPersona('agency')}
                className={cn(
                  "px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200",
                  !isEnterprise
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="inline-block w-4 h-4 mr-2" />
                Agency
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in">
          {content.features.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <Card 
                key={index}
                className="border-2 hover:shadow-lg transition-shadow duration-200"
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center",
                    isEnterprise 
                      ? "bg-primary/10" 
                      : "bg-secondary/10"
                  )}>
                    <Icon className={cn(
                      "w-7 h-7",
                      isEnterprise 
                        ? "text-primary" 
                        : "text-secondary"
                    )} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Outcome Statement */}
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-xl font-medium text-foreground max-w-2xl mx-auto">
            {content.outcome}
          </p>
        </div>

        {/* CTA Button */}
        <div className="text-center mb-12 animate-fade-in">
          <Button 
            size="lg"
            className="text-base px-8"
            asChild
          >
            <a href={content.cta.link}>{content.cta.text}</a>
          </Button>
        </div>

        {/* Bottom Tagline */}
        <div className="text-center">
          <p className="text-muted-foreground max-w-xl mx-auto">
            {enterpriseAgencyContent.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}
