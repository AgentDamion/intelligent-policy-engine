import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Lock, Globe, Database } from 'lucide-react';
import { alternate2ContentNew } from '@/content/alternate2LandingNew';

export function NewTrustSection() {
  const { trustSection } = alternate2ContentNew;
  
  const companies = [
    'Pfizer', 'Novartis', 'Johnson & Johnson',
    'Ogilvy', 'Publicis', 'WPP'
  ];

  const badgeIcons = [Shield, Lock, Globe, Database];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-6">
        {/* Logo Strip */}
        <div className="text-center mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center mb-8">
            {companies.map((company, index) => (
              <div 
                key={index}
                className="w-32 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center opacity-60 hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-medium text-slate-500 text-center px-2">
                  {company}
                </span>
              </div>
            ))}
          </div>

          <p className="text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed">
            {trustSection.logoCaption}
          </p>
        </div>

        {/* Compliance Badges */}
        <TooltipProvider>
          <div className="flex flex-wrap justify-center gap-4">
            {trustSection.complianceBadges.map((badge, index) => {
              const IconComponent = badgeIcons[index];
              
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <a
                      href={badge.link}
                      className="flex items-center gap-3 px-6 py-3 bg-slate-50 hover:bg-mint-50 border border-slate-200 hover:border-mint-500/30 rounded-full transition-all duration-200 group"
                    >
                      <IconComponent className="w-5 h-5 text-slate-600 group-hover:text-mint-500" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-mint-500">
                        {badge.title}
                      </span>
                    </a>
                  </TooltipTrigger>
                  {badge.tooltip && (
                    <TooltipContent>
                      <p>{badge.tooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </section>
  );
}