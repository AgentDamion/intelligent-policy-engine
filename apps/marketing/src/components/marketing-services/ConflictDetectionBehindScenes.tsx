import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Brain, Network, Zap, AlertTriangle, CheckCircle, Clock, ArrowRight, Code, Database, GitBranch } from 'lucide-react';

const ConflictDetectionBehindScenes = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const detectionSteps = [
    {
      title: "Data Ingestion",
      icon: Database,
      description: "Multi-source client data aggregation",
      details: "Continuously ingests client data from CRM, project management systems, contracts, and industry databases to build comprehensive client profiles.",
      code: `// Real-time client profiling
const clientProfile = await analyzeClient({
  industry: "Healthcare",
  competitors: ["Company A", "Company B"],
  projects: activeProjects,
  contracts: signedAgreements
});`
    },
    {
      title: "Pattern Recognition",
      icon: Brain,
      description: "ML algorithms identify conflict patterns",
      details: "Advanced machine learning models analyze historical conflicts, industry relationships, and competitive dynamics to identify potential issues.",
      code: `// Conflict pattern analysis
const conflictRisk = await detectPatterns({
  clientA: "Healthcare Corp",
  clientB: "Medical Devices Inc",
  relationshipType: "supplier_customer",
  confidentialityLevel: "high"
});`
    },
    {
      title: "Network Analysis",
      icon: Network,
      description: "Relationship mapping and impact assessment",
      details: "Graph neural networks map complex business relationships, ownership structures, and competitive landscapes across your entire client portfolio.",
      code: `// Relationship graph analysis
const riskScore = calculateNetworkRisk({
  nodes: allClients,
  edges: businessRelationships,
  depth: 3, // degrees of separation
  confidentiality: contractTerms
});`
    },
    {
      title: "Real-time Alerts",
      icon: Zap,
      description: "Instant conflict notifications and recommendations",
      details: "Immediate alerts with specific conflict details, risk levels, and actionable recommendations for resolution or prevention.",
      code: `// Alert generation
if (riskScore > threshold) {
  await generateAlert({
    type: "POTENTIAL_CONFLICT",
    clients: [clientA, clientB],
    recommendations: suggestActions(riskScore)
  });
}`
    }
  ];

  const aiComponents = [
    {
      name: "Natural Language Processing",
      description: "Analyzes contracts, emails, and documents to understand client relationships and confidentiality requirements",
      technology: "Transformer-based models with legal domain adaptation"
    },
    {
      name: "Graph Neural Networks",
      description: "Maps complex business relationships and ownership structures across industries",
      technology: "GraphSAGE with temporal dynamics for evolving relationships"
    },
    {
      name: "Anomaly Detection",
      description: "Identifies unusual patterns that might indicate emerging conflicts or opportunities",
      technology: "Isolation forests with time-series analysis"
    },
    {
      name: "Predictive Modeling",
      description: "Forecasts potential conflicts based on market changes and business developments",
      technology: "Ensemble methods with real-time feature engineering"
    }
  ];

  const realTimeExample = {
    scenario: "New client onboarding in pharmaceutical sector",
    timeline: [
      { time: "0.1s", action: "Client data ingested", status: "complete" },
      { time: "0.3s", action: "Industry relationships mapped", status: "complete" },
      { time: "0.7s", action: "Competitor analysis completed", status: "complete" },
      { time: "1.2s", action: "Conflict risk assessment", status: "warning" },
      { time: "1.5s", action: "Recommendations generated", status: "complete" }
    ],
    result: "POTENTIAL CONFLICT DETECTED: Client has strategic partnership with existing client's main competitor. Recommended action: Separate team assignment with enhanced confidentiality protocols."
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Eye className="w-4 h-4 mr-2" />
            Behind the Scenes
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            How AI Detects Client Conflicts
            <span className="text-primary"> in Real-Time</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Peek under the hood of our conflict detection system. See the sophisticated AI 
            architecture that protects your agency from costly mistakes and missed opportunities.
          </p>
        </div>

        <Tabs defaultValue="process" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="process">Detection Process</TabsTrigger>
            <TabsTrigger value="technology">AI Technology</TabsTrigger>
            <TabsTrigger value="example">Live Example</TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                {detectionSteps.map((step, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all duration-300 ${
                      activeStep === index ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                    }`}
                    onClick={() => setActiveStep(index)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${
                          activeStep === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        } flex items-center justify-center`}>
                          {React.createElement(step.icon, { className: "w-6 h-6" })}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{step.title}</h3>
                          <p className="text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="lg:sticky lg:top-8">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    {React.createElement(detectionSteps[activeStep].icon, { className: "w-8 h-8 text-primary" })}
                    <h3 className="text-2xl font-bold">{detectionSteps[activeStep].title}</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">{detectionSteps[activeStep].details}</p>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-4 h-4" />
                      <span className="text-sm font-medium">Implementation Example</span>
                    </div>
                    <pre className="text-sm overflow-x-auto">
                      <code>{detectionSteps[activeStep].code}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="technology">
            <div className="grid lg:grid-cols-2 gap-8">
              {aiComponents.map((component, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="w-6 h-6 text-primary" />
                      <h3 className="text-xl font-bold">{component.name}</h3>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{component.description}</p>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">Technology Stack:</div>
                      <div className="text-sm text-muted-foreground">{component.technology}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="example">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Real-Time Conflict Detection Example</h3>
                
                <div className="bg-muted/30 rounded-lg p-6 mb-6">
                  <h4 className="font-bold mb-4">Scenario: {realTimeExample.scenario}</h4>
                  
                  <div className="space-y-3 mb-6">
                    {realTimeExample.timeline.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {item.time}
                        </div>
                        <div className="flex-1">{item.action}</div>
                        <div className="flex items-center gap-2">
                          {item.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                          <span className="text-sm capitalize">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Detection Result:
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          {realTimeExample.result}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/contact?type=examples')}
                    size="lg"
                    className="bg-teal hover:bg-teal/90 text-white"
                  >
                    <GitBranch className="w-5 h-5 mr-2" />
                    See More Detection Examples
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Technical Sophistication Callout */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Enterprise-Grade AI Architecture</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            This level of technical sophistication justifies premium pricing because it prevents 
            costly conflicts, accelerates decision-making, and creates competitive advantages 
            that basic tools simply cannot match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/contact?type=technical-deep-dive&source=marketing-services')}
              size="lg" 
              className="px-8 bg-teal hover:bg-teal/90 text-white"
            >
              <Eye className="w-5 h-5 mr-2" />
              Request Technical Deep Dive
            </Button>
            <Button 
              onClick={() => navigate('/pricing?highlight=premium')}
              variant="outline" 
              size="lg" 
              className="px-8"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              See Pricing Justification
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConflictDetectionBehindScenes;