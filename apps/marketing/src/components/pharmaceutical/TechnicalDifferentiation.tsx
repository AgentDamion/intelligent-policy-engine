import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Zap, Target, Brain, Shield } from 'lucide-react';

const TechnicalDifferentiation = () => {
  const comparisonData = [
    {
      feature: "AI Decision Intelligence",
      basic: "Rule-based workflows",
      aicomply: "Multi-agent reasoning with context awareness",
      advantage: "Adapts to complex scenarios vs. rigid rule following"
    },
    {
      feature: "Regulatory Understanding",
      basic: "Static compliance checklists",
      aicomply: "Dynamic interpretation of evolving FDA guidance",
      advantage: "Real-time adaptation to regulatory changes"
    },
    {
      feature: "Stakeholder Coordination",
      basic: "Manual approval routing",
      aicomply: "AI-mediated negotiation and consensus building",
      advantage: "Automated resolution of competing priorities"
    },
    {
      feature: "Risk Assessment",
      basic: "Historical pattern matching",
      aicomply: "Predictive risk modeling with continuous learning",
      advantage: "Proactive risk identification and mitigation"
    },
    {
      feature: "Audit Preparedness",
      basic: "Compliance documentation",
      aicomply: "Self-validating audit trails with explanatory reasoning",
      advantage: "FDA-ready evidence with full decision transparency"
    },
    {
      feature: "Integration Complexity",
      basic: "Point-to-point integrations",
      aicomply: "Universal API with intelligent data harmonization",
      advantage: "Seamless integration across heterogeneous systems"
    }
  ];

  const differentiators = [
    {
      icon: Brain,
      title: "Cognitive Architecture",
      description: "Multi-layered AI reasoning that mirrors human regulatory expertise",
      details: "Our system combines symbolic reasoning, neural networks, and knowledge graphs to understand regulatory nuance beyond simple rule matching."
    },
    {
      icon: Target,
      title: "Adaptive Intelligence",
      description: "Learns and evolves with your organization's regulatory patterns",
      details: "Machine learning algorithms continuously refine decision-making based on your specific therapeutic areas, approval patterns, and organizational culture."
    },
    {
      icon: Shield,
      title: "Regulatory Fidelity",
      description: "Built specifically for pharmaceutical regulatory requirements",
      details: "Purpose-built for 21 CFR Part 11, GxP, and ICH guidelines—not a generic workflow tool adapted for pharma."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Technical Differentiation
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            Why Basic Workflow Tools 
            <span className="text-primary"> Fall Short in Pharma</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pharmaceutical AI governance requires more than digital forms and approval routing. 
            It demands true regulatory intelligence.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-6 font-semibold">Capability</th>
                      <th className="text-left p-6 font-semibold text-muted-foreground">Basic Workflow Tools</th>
                      <th className="text-left p-6 font-semibold text-brand-teal">aicomplyr.io Intelligence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-6 font-medium">{row.feature}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <X className="w-5 h-5 text-destructive" />
                            <span className="text-muted-foreground">{row.basic}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            <span className="font-medium">{row.aicomply}</span>
                          </div>
                          <p className="text-sm text-muted-foreground ml-8">{row.advantage}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Differentiators */}
        <div className="grid lg:grid-cols-3 gap-8">
          {differentiators.map((diff, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <diff.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{diff.title}</h3>
                <p className="text-muted-foreground mb-4">{diff.description}</p>
                <p className="text-sm leading-relaxed">{diff.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">The Intelligence Difference</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              While workflow tools digitize existing processes, aicomplyr.io transforms how pharmaceutical 
              organizations think about AI governance—making intelligent decisions, not just following workflows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalDifferentiation;