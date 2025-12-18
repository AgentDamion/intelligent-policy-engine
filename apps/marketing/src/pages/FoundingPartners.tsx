import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import NewFooter from '@/components/NewFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Rocket, Star, Users, TrendingUp, Award } from 'lucide-react';

const FoundingPartners = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Founding partner application submitted');
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Star className="w-4 h-4 mr-2" />
              Limited Availability
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Become a <span className="text-primary">Founding Partner</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join an exclusive group of forward-thinking agencies shaping the future of AI governance
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left: Benefits */}
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Founding Partner Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Priority Feature Development</div>
                      <div className="text-sm text-muted-foreground">Direct input on product roadmap and feature prioritization</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Founding Partner Pricing</div>
                      <div className="text-sm text-muted-foreground">Lock in exclusive pricing for life - up to 40% off standard rates</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Dedicated Success Manager</div>
                      <div className="text-sm text-muted-foreground">Personal point of contact for onboarding and ongoing support</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Co-Marketing Opportunities</div>
                      <div className="text-sm text-muted-foreground">Joint case studies, webinars, and featured success stories</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Early Access to New Features</div>
                      <div className="text-sm text-muted-foreground">Beta access to innovations before public release</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Founding Partner Badge</div>
                      <div className="text-sm text-muted-foreground">Exclusive recognition as an AI governance pioneer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ideal Founding Partner Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span>Marketing agencies serving regulated industries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-primary" />
                    <span>Early adopters of AI technology</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Growth-focused with 5+ enterprise clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-primary" />
                    <span>Committed to AI governance excellence</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Application Form */}
            <Card>
              <CardHeader>
                <CardTitle>Apply to Become a Founding Partner</CardTitle>
                <CardDescription>Limited spots available - applications reviewed within 48 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Agency Name *</label>
                    <Input required placeholder="Your Agency Name" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name *</label>
                    <Input required placeholder="John Smith" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Title *</label>
                    <Input required placeholder="CEO, COO, etc." />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Work Email *</label>
                    <Input required type="email" placeholder="john@agency.com" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                    <Input required type="tel" placeholder="+1 (555) 000-0000" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Agency Website</label>
                    <Input type="url" placeholder="https://youragency.com" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Number of Enterprise Clients</label>
                    <Input type="number" placeholder="10" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Industries Served *</label>
                    <Input required placeholder="Pharmaceutical, Financial Services, etc." />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Current AI Tools in Use</label>
                    <Input placeholder="ChatGPT, Midjourney, etc." />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Why do you want to be a Founding Partner? *</label>
                    <Textarea 
                      required
                      placeholder="Tell us about your vision for AI governance and how you plan to leverage the partnership..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                    <Rocket className="w-4 h-4 mr-2" />
                    Submit Application
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree to our terms and privacy policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="text-center bg-muted/30 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Join Leading Agencies</h3>
            <p className="text-muted-foreground mb-6">
              Founding partners are already seeing 75% faster approval times and 35% higher client retention
            </p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              <div className="text-sm font-medium">Top-tier agencies only</div>
              <div className="text-sm font-medium">·</div>
              <div className="text-sm font-medium">Limited to 50 partners</div>
              <div className="text-sm font-medium">·</div>
              <div className="text-sm font-medium">Applications closing soon</div>
            </div>
          </div>
        </div>
      </section>

      <NewFooter />
    </div>
  );
};

export default FoundingPartners;
