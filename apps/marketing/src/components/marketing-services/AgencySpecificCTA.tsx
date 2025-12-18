import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Phone, BarChart3, Target } from 'lucide-react';

const AgencySpecificCTA = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-gradient-to-br from-accent/5 to-teal/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to Turn Proof Into <span className="text-teal">Growth?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join agencies using aicomplyr.io to shorten MLR cycles, boost client retention, and command premium pricing
          </p>
        </div>

        <div className="text-center mb-12">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-teal mb-2">–75%</div>
              <div className="text-sm text-muted-foreground">Average approval time</div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-teal mb-2">+35%</div>
              <div className="text-sm text-muted-foreground">Client expansion rate</div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-teal mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Compliance proof visibility</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-teal/20">
            <CardHeader className="text-center pb-4">
              <Badge className="bg-teal/10 text-teal border-teal/20 mb-2 mx-auto">Most Popular</Badge>
              <div className="text-4xl mb-4">📊</div>
              <CardTitle className="text-xl">Book a Governance Proof Demo</CardTitle>
              <CardDescription className="text-base">
                See how to demonstrate compliance for both third-party and home-grown AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-teal mr-2" />
                Live platform walkthrough
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-teal mr-2" />
                Custom AI tool scenarios
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-teal mr-2" />
                Client-ready proof examples
              </div>
              <Button 
                onClick={() => navigate('/book-demo')}
                className="w-full mt-6 bg-teal hover:bg-teal/90 text-white"
              >
                Book Demo Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="text-4xl mb-4">🤝</div>
              <CardTitle className="text-xl">Join as a Founding Partner</CardTitle>
              <CardDescription className="text-base">
                Exclusive early access with preferential pricing and dedicated support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Priority feature development
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Founding partner pricing
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Co-marketing opportunities
              </div>
              <Button 
                onClick={() => navigate('/founding-partners')}
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-white"
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </section>
  );
};

export default AgencySpecificCTA;