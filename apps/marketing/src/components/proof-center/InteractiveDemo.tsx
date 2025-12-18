import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const workflowSteps = [
    {
      title: 'Policy Creation',
      description: 'Define compliance requirements',
      content: 'Creating policy: "All content must include FDA-compliant disclaimers"',
      status: 'pending'
    },
    {
      title: 'AI Usage',
      description: 'AI generates content',
      content: 'AI generates: "This supplement may help with energy levels..."',
      status: 'pending'
    },
    {
      title: 'Approval Process',
      description: 'Policy engine evaluates',
      content: 'Policy engine flags: Missing FDA disclaimer, requires modification',
      status: 'pending'
    },
    {
      title: 'Audit Trail',
      description: 'Decision documented',
      content: 'Logged: Content modified per FDA 21 CFR 101.93 requirements',
      status: 'pending'
    }
  ];

  const runDemo = () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= workflowSteps.length - 1) {
          clearInterval(timer);
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsRunning(false);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Interactive Governance Demo
          </h2>
          <p className="text-lg text-muted-foreground">
            Try the governance workflow simulator - see how policies are applied in real-time
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Governance Workflow Simulator
              </CardTitle>
              <div className="text-center">
                <Button 
                  onClick={runDemo} 
                  disabled={isRunning}
                  className="mr-4"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isRunning ? 'Running...' : 'Start Demo'}
                </Button>
                <Button variant="outline" onClick={resetDemo}>
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {index <= currentStep ? (
                        index === currentStep && isRunning ? (
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                          </div>
                        ) : (
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        )
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-muted-foreground"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant={index <= currentStep ? 'default' : 'secondary'}>
                          {index <= currentStep ? 'Complete' : 'Waiting'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                      {index <= currentStep && (
                        <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                          {step.content}
                        </div>
                      )}
                    </div>
                    
                    {index < workflowSteps.length - 1 && (
                      <ArrowRight className="text-muted-foreground mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to See This with Your Data?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Experience governance workflows tailored to your specific compliance requirements
                </p>
                <Button size="lg" className="text-lg px-8 py-6">
                  Request Live Demo with Your Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}