import MarketingHeader from "@/components/marketing/MarketingHeader";
import NewFooter from "@/components/NewFooter";
import { ArrowRight, TrendingUp, Users, Globe, Award, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Investors = () => {
  return (
    <div className="min-h-screen bg-background">
        <MarketingHeader />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-5xl md:text-6xl font-bold">
                Investing in the Future of{" "}
                <span className="text-primary">AI Governance</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Building the compliance infrastructure that enables safe, responsible AI adoption across regulated industries.
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Market Opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">$50B+</div>
                  <p className="text-sm text-muted-foreground mt-1">Pharma AI compliance TAM</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Approval Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">4 days</div>
                  <p className="text-sm text-muted-foreground mt-1">vs. 47 industry avg.</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Customer Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">Top 10</div>
                  <p className="text-sm text-muted-foreground mt-1">Pharma companies</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Efficiency Gain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">10.7x</div>
                  <p className="text-sm text-muted-foreground mt-1">Faster approvals</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Market Opportunity */}
        <section className="py-16 px-6 bg-secondary/30">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <Globe className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Market Opportunity</span>
                </div>
                <h2 className="text-4xl font-bold">
                  The AI Governance Gap is Growing
                </h2>
                <p className="text-lg text-muted-foreground">
                  Regulated industries are deploying AI faster than governance can keep pace. We're building the infrastructure to close that gap.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Pharmaceutical market: $50B+</div>
                      <div className="text-sm text-muted-foreground">FDA compliance for AI-powered drug development</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Expanding regulatory landscape</div>
                      <div className="text-sm text-muted-foreground">EU AI Act, FDA guidance, GDPR enforcement accelerating demand</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Multi-vertical expansion</div>
                      <div className="text-sm text-muted-foreground">Financial services, healthcare, marketing agencies</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Addressable Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Pharmaceutical</span>
                          <span className="text-sm font-bold">$50B+</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Financial Services</span>
                          <span className="text-sm font-bold">$35B+</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/70" style={{ width: '35%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Healthcare</span>
                          <span className="text-sm font-bold">$30B+</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/50" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Marketing/Agencies</span>
                          <span className="text-sm font-bold">$15B+</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/30" style={{ width: '15%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Thesis */}
        <section className="py-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                <Award className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Investment Thesis</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Why aicomply.io?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We're not just building software—we're building the operating system for responsible AI deployment.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span>Regulatory Expertise</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Deep domain knowledge in FDA 21 CFR Part 11, EU AI Act, GDPR, and industry-specific compliance requirements. Our team includes former regulatory professionals.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <span>Proven Platform</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Operational proof with live customers. 10.7x faster approvals, 99.9% system confidence, real-time audit trails. Not a prototype—a production platform.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <span>Network Effects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Every policy, decision, and audit trail strengthens the platform. Multi-sided marketplace connects enterprises, agencies, and vendors.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="py-16 px-6 bg-secondary/30">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Leadership Team</h2>
              <p className="text-lg text-muted-foreground">
                Industry veterans with deep expertise in compliance, AI, and enterprise software.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold mb-1">Executive Team</h3>
                  <p className="text-sm text-muted-foreground mb-3">Founders & Leadership</p>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Linkedin className="h-4 w-4" />
                    Connect
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold mb-1">Advisory Board</h3>
                  <p className="text-sm text-muted-foreground mb-3">Industry Experts</p>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Linkedin className="h-4 w-4" />
                    Connect
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold mb-1">Board of Directors</h3>
                  <p className="text-sm text-muted-foreground mb-3">Strategic Oversight</p>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Linkedin className="h-4 w-4" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 px-6">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Interested in Learning More?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're building the infrastructure for responsible AI deployment at scale. Join us in defining the future of AI governance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                Contact Investor Relations
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Download Investor Deck
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Email: <a href="mailto:investors@aicomply.io" className="text-primary hover:underline">investors@aicomply.io</a>
            </p>
          </div>
        </section>

        <NewFooter />
    </div>
  );
};

export default Investors;
