import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, GitBranch, MessageSquare, Zap, ArrowRight } from 'lucide-react';

const AIAgentIntelligence = () => {
  const agents = [
    {
      name: "Context Agent",
      icon: Brain,
      description: "Understands the full regulatory landscape and organizational context",
      capabilities: [
        "Maps complex regulatory relationships across 21 CFR Part 11, ICH guidelines, and GxP requirements",
        "Maintains awareness of organizational hierarchy and approval workflows",
        "Tracks dependencies between policies, SOPs, and validation protocols",
        "Adapts recommendations based on therapeutic area and development phase"
      ],
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      name: "Policy Agent",
      icon: GitBranch,
      description: "Enforces governance frameworks and compliance requirements",
      capabilities: [
        "Real-time validation against FDA guidance documents and industry standards",
        "Dynamic policy interpretation based on AI tool classification (SaMD, CDSS, etc.)",
        "Automated conflict detection between overlapping regulatory requirements",
        "Version control and change management for evolving compliance standards"
      ],
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      name: "Negotiation Agent",
      icon: MessageSquare,
      description: "Facilitates stakeholder alignment and decision-making",
      capabilities: [
        "Mediates between R&D priorities and regulatory compliance requirements",
        "Facilitates cross-functional consensus on AI tool deployment strategies",
        "Manages escalation workflows for complex approval scenarios",
        "Optimizes resource allocation across competing regulatory priorities"
      ],
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-4 h-4 mr-2" />
            AI Agent Intelligence
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            Beyond Workflow Automation: 
            <span className="text-primary"> True AI Intelligence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our multi-agent AI system doesn't just follow rules—it understands context, 
            negotiates solutions, and adapts to your unique regulatory environment.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {agents.map((agent, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl ${agent.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <agent.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{agent.name}</h3>
                <p className="text-muted-foreground mb-6">{agent.description}</p>
                
                <div className="space-y-3">
                  {agent.capabilities.map((capability, capIndex) => (
                    <div key={capIndex} className="flex items-start gap-3">
                      <ArrowRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm">{capability}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Coordinated Intelligence in Action</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            These agents work together seamlessly, sharing context and coordinating decisions 
            to provide pharmaceutical organizations with unprecedented regulatory intelligence and automation.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Context</span>
            <ArrowRight className="w-4 h-4" />
            <span>Policy</span>
            <ArrowRight className="w-4 h-4" />
            <span>Negotiation</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-primary font-medium">Optimal Decision</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgentIntelligence;