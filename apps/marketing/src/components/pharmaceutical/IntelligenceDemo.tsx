import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Calendar, ArrowRight, Zap } from 'lucide-react';

const IntelligenceDemo = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Eye className="w-4 h-4 mr-2" />
            Live Intelligence Demo
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            See the Intelligence 
            <span className="text-primary"> in Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch our AI agents work together to solve real pharmaceutical AI governance challenges. 
            Experience the difference between workflow automation and true regulatory intelligence.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Play className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Interactive Scenario Demo</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span>Multi-stakeholder AI tool approval process</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span>Real-time regulatory conflict resolution</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span>Dynamic policy interpretation and application</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span>AI agent negotiation and consensus building</span>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Start Interactive Demo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Executive Deep Dive</h3>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Join our Chief AI Officer for a 30-minute technical deep dive into our 
                  multi-agent architecture and see real-world pharmaceutical use cases.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span className="text-sm font-medium">30 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Format:</span>
                    <span className="text-sm font-medium">Live demo + Q&A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Audience:</span>
                    <span className="text-sm font-medium">Technical & regulatory leaders</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" size="lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Deep Dive
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="rounded-full w-20 h-20">
                    <Play className="w-8 h-8 ml-1" />
                  </Button>
                </div>
                
                {/* Demo Preview Elements */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500/20 text-green-600 border-green-300">
                    <Zap className="w-3 h-3 mr-1" />
                    Live Demo
                  </Badge>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Current Scenario:</div>
                    <div className="text-xs text-muted-foreground">
                      Multi-agent resolution of FDA 21 CFR Part 11 compliance requirements 
                      for new oncology AI diagnostic tool...
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-lg p-3 shadow-lg">
              <div className="text-xs font-medium">Live Metrics</div>
              <div className="text-lg font-bold">94% Compliance</div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground rounded-lg p-3 shadow-lg">
              <div className="text-xs font-medium">Decision Time</div>
              <div className="text-lg font-bold">12.3 seconds</div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-muted/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Experience the Difference?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              See how true AI intelligence transforms pharmaceutical governance beyond 
              simple workflow automation. Experience decision-making at the speed of AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                <Play className="w-5 h-5 mr-2" />
                Try Interactive Demo
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                <Calendar className="w-5 h-5 mr-2" />
                Book Expert Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntelligenceDemo;