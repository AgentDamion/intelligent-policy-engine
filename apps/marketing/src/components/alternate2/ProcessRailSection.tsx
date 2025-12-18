import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, Send, Route, Eye, CheckCircle, Rocket } from 'lucide-react';
import { alternate2ContentNew } from '@/content/alternate2LandingNew';

export function ProcessRailSection() {
  const { processRail } = alternate2ContentNew;
  
  const stepIcons = [Send, Route, Eye, CheckCircle, Rocket];

  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-700 mb-6">
            {processRail.header}
          </h2>
        </div>

        {/* Process Rail */}
        <TooltipProvider>
          <div className="flex items-center justify-center mb-16 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
              {processRail.steps.map((step, index) => {
                const IconComponent = stepIcons[index];
                const isLast = index === processRail.steps.length - 1;
                const isOdd = index % 2 === 1;
                
                return (
                  <React.Fragment key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-3 min-w-[120px] cursor-help">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow ${
                            isOdd ? 'bg-coral-100' : 'bg-teal-50'
                          }`}>
                            <IconComponent className={`w-8 h-8 ${
                              isOdd ? 'text-coral-500' : 'text-teal-600'
                            }`} />
                          </div>
                          <span className="font-bold text-slate-700 text-center">
                            {step.title}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{step.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {!isLast && (
                      <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </TooltipProvider>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="bg-coral-100 border-coral-500/20 rounded-2xl">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {processRail.comparison.traditional.title}
              </h3>
              <p className="text-slate-600">
                {processRail.comparison.traditional.description}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-mint-50 border-mint-500/20 rounded-2xl">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {processRail.comparison.platform.title}
              </h3>
              <p className="text-slate-600">
                {processRail.comparison.platform.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="bg-mint-500 hover:bg-mint-500/90 text-white px-8 py-6 text-base rounded-2xl">
            {processRail.cta.text}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}