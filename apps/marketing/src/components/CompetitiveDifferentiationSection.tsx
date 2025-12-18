import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Target, ArrowRight } from 'lucide-react';

const CompetitiveDifferentiationSection = () => {
  const columns = [
    {
      icon: FileText,
      title: 'What Competitors Claim',
      subtitle: 'Others Promise',
      items: [
        'AI governance capabilities',
        'Compliance frameworks',
        'Agency oversight tools',
        'Risk management'
      ],
      styling: 'muted',
      iconBg: 'bg-muted/50',
      iconColor: 'text-muted-foreground',
      cardBg: 'bg-muted/10'
    },
    {
      icon: CheckCircle,
      title: 'What We Demonstrate',
      subtitle: 'We Prove',
      items: [
        'Live audit trail from our platform development',
        'Real FDA regulatory citations',
        'Actual multi-party governance workflows',
        'Operational transparency daily'
      ],
      styling: 'primary',
      iconBg: 'bg-brand-teal/10',
      iconColor: 'text-brand-teal',
      cardBg: 'bg-brand-teal/5 border-brand-teal/20'
    },
    {
      icon: Target,
      title: 'Your Result',
      subtitle: 'You Get',
      items: [
        'Undeniable evidence it works',
        'FDA-ready audit documentation',
        'Proven regulatory compliance',
        'Zero implementation risk'
      ],
      styling: 'success',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      cardBg: 'bg-green-50/50 border-green-200/50'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why operational proof beats theoretical compliance
          </h2>
          <p className="text-lg text-muted-foreground">
            While others make promises, we provide evidence
          </p>
        </div>

        {/* Three-Column Comparison */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8 mb-12">
          {columns.map((column, index) => (
            <Card 
              key={index} 
              className={`border shadow-sm hover:shadow-md transition-shadow ${column.cardBg} w-full`}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 ${column.iconBg} rounded-full flex items-center justify-center`}>
                    <column.icon className={`w-8 h-8 ${column.iconColor}`} />
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {column.subtitle}
                </div>
                <CardTitle className="text-xl font-bold">
                  {column.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {column.items.map((item, itemIndex) => (
                     <li key={itemIndex} className="flex items-start gap-3">
                       <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                         column.styling === 'primary' ? 'bg-brand-teal' : 
                         column.styling === 'success' ? 'bg-green-500' : 
                         'bg-muted-foreground/50'
                       }`} />
                       <span className={`text-sm leading-relaxed break-words ${
                         column.styling === 'primary' ? 'text-foreground font-medium' :
                         column.styling === 'success' ? 'text-foreground font-medium' :
                         'text-muted-foreground'
                       }`}>
                         {item}
                       </span>
                     </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Call-out */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 md:p-8 text-center">
          <p className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6 leading-relaxed">
            The difference: Every other vendor asks you to trust their promises. We show you the proof.
          </p>
          <Button size="lg" className="group w-full sm:w-auto">
            See Our Operational Proof
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveDifferentiationSection;