import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, DollarSign, FileX, Calculator, Calendar, Presentation, AlertTriangle, BarChart3, MessageSquare } from 'lucide-react';

const InternalChampionKit = () => {
  const slideTopics = [
    { title: 'The $126B Problem', icon: DollarSign, gradient: 'from-red-50 to-red-100', color: 'text-red-500' },
    { title: 'Why PDF Policies Fail', icon: FileX, gradient: 'from-orange-50 to-orange-100', color: 'text-orange-500' },
    { title: 'ROI Calculator', icon: Calculator, gradient: 'from-green-50 to-green-100', color: 'text-green-500' },
    { title: '90-Day Roadmap', icon: Calendar, gradient: 'from-blue-50 to-blue-100', color: 'text-blue-500' }
  ];

  const whatIsInside = [
    { text: '12 slides (fully editable PowerPoint)', icon: Presentation },
    { text: 'ROI calculator with your numbers', icon: Calculator },
    { text: 'Risk quantification framework', icon: AlertTriangle },
    { text: 'Competitive comparison table (build vs buy)', icon: BarChart3 },
    { text: '90-day implementation timeline', icon: Calendar },
    { text: 'Talking points for common objections', icon: MessageSquare }
  ];

  return (
    <section className="py-16 bg-[hsl(var(--brand-teal))]/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Selling This Internally? We've Got Your Back.
          </h2>
          <p className="text-xl text-muted-foreground">
            Download our ready-made "Business Case for Executable Policy" deck—designed to help you get budget approval in your next leadership meeting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Slide Thumbnails */}
          <div className="grid grid-cols-2 gap-4">
            {slideTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <Card key={index} className="border-2 hover:border-[hsl(var(--brand-teal))] transition-colors">
                  <CardContent className="p-6">
                    <div className={`aspect-[4/3] bg-gradient-to-br ${topic.gradient} rounded-lg mb-3 flex items-center justify-center`}>
                      <Icon className={`h-12 w-12 ${topic.color}`} />
                    </div>
                    <p className="text-sm font-medium text-center">Slide {index + 1}</p>
                    <p className="text-xs text-muted-foreground text-center mt-1">{topic.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right: What's Inside */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">What's Inside:</h3>
              <div className="space-y-3">
                {whatIsInside.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-[hsl(var(--brand-teal))] flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item.text}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-center text-muted-foreground mt-6 mb-4">
                <span className="font-semibold text-[hsl(var(--brand-teal))]">12 compliance leaders</span> used this deck to secure pilot budget
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white"
              data-track="champion-kit-download"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Slide Deck + White Papers
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              PPTX + 3 PDFs • Requires email
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <Card className="mt-12 max-w-4xl mx-auto border-2 border-[hsl(var(--brand-teal))]/20 bg-background">
          <CardContent className="p-8">
            <blockquote className="text-lg text-foreground mb-4">
              "I presented this deck to our CIO and CFO. Got provisional budget approval for a pilot in the same meeting. The ROI calculator made it a no-brainer."
            </blockquote>
            <footer className="text-sm text-muted-foreground">
              — Director of Compliance, Mid-Market Pharma
            </footer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default InternalChampionKit;
