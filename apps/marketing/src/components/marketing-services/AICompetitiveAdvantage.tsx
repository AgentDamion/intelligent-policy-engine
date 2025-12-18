import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Target, TrendingUp, Shield, Brain, Clock, ArrowRight, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import ROICalculatorModal from './ROICalculatorModal';

const AICompetitiveAdvantage = () => {
  const [isROIModalOpen, setIsROIModalOpen] = useState(false);
  
  const advantages = [
    {
      icon: AlertTriangle,
      title: "Detect Client Policy Conflicts",
      description: "AI automatically identifies when client policies conflict with each other across your portfolio, preventing costly mistakes before they happen.",
      metrics: "100% conflict detection accuracy",
      color: "bg-red-500/10 text-red-600 border-red-200"
    },
    {
      icon: BarChart3,
      title: "Analyze Urgency & Context",
      description: "Smart prioritization that considers deadlines, client importance, regulatory requirements, and business impact to optimize your team's focus.",
      metrics: "75% faster response times",
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      icon: Brain,
      title: "Generate Intelligent Compromises",
      description: "When conflicts arise, AI suggests creative solutions that satisfy multiple clients' requirements while maintaining compliance standards.",
      metrics: "89% client satisfaction with AI solutions",
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      icon: CheckCircle,
      title: "Provide Confidence Scoring",
      description: "Every decision comes with AI-calculated confidence scores, helping you understand risk levels and make informed choices.",
      metrics: "95% prediction accuracy",
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    }
  ];

  const competitiveScenarios = [
    {
      scenario: "Competing Pharmaceutical Companies",
      traditional: "Manual policy review, risk of conflicts, potential contract violations",
      aiPowered: "When working on campaigns for competing pharmaceutical companies, our AI automatically detects policy conflicts and suggests compliant approaches that satisfy both clients' requirements.",
      impact: "100% conflict prevention, zero compliance violations"
    },
    {
      scenario: "Multi-Client Pitch Conflicts",
      traditional: "Manual conflict checks, delayed responses, lost opportunities",
      aiPowered: "Instant conflict resolution with alternative strategies and optimized team allocation",
      impact: "75% faster pitch response time"
    },
    {
      scenario: "Competitive Intelligence",
      traditional: "Quarterly competitive analysis, static positioning",
      aiPowered: "Real-time competitor monitoring with dynamic positioning recommendations",
      impact: "89% more accurate competitive insights"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Brain className="w-4 h-4 mr-2" />
            AI Intelligence That Gives You Competitive Advantage
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            AI Intelligence That Gives You
            <span className="text-primary"> Competitive Advantage</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI agents don't just automate tasks—they provide sophisticated intelligence 
            that helps agencies deliver superior results and command premium pricing.
          </p>
        </div>

        {/* AI Advantages Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {advantages.map((advantage, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl ${advantage.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <advantage.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{advantage.title}</h3>
                <p className="text-muted-foreground mb-4">{advantage.description}</p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-medium">
                    {advantage.metrics}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Competitive Scenarios */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">Traditional vs. AI-Powered Approach</h3>
          
          <div className="space-y-8">
            {competitiveScenarios.map((scenario, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold mb-6">{scenario.scenario}</h4>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Traditional Approach</span>
                      </div>
                      <p className="text-muted-foreground">{scenario.traditional}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="font-medium text-primary">AI-Powered Solution</span>
                      </div>
                      <p className="mb-4">{scenario.aiPowered}</p>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {scenario.impact}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Premium Pricing Justification */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Why Agencies Using aicomplyr.io Command Premium Pricing</h3>
            <p className="text-lg text-muted-foreground mb-6">
              This intelligence is why agencies using aicomplyr.io command <span className="font-bold text-brand-teal">25% premium pricing</span> -
              clients pay more for proven sophistication.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">25%</div>
                <div className="text-sm text-muted-foreground">Premium Pricing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Conflict Prevention</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Decision Accuracy</div>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsROIModalOpen(true)}
              size="lg" 
              className="px-8 bg-teal hover:bg-teal/90 text-white"
            >
              <Target className="w-5 h-5 mr-2" />
              Calculate Your ROI
            </Button>
          </div>
        </div>
      </div>
      
      <ROICalculatorModal 
        open={isROIModalOpen} 
        onOpenChange={setIsROIModalOpen} 
      />
    </section>
  );
};

export default AICompetitiveAdvantage;