import MarketingHeader from '@/components/marketing/MarketingHeader';
import NewFooter from '@/components/NewFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Users, Target, CheckCircle, Award, Calendar, Building2, Lock, FileCheck, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust",
      description: "We build unshakeable confidence in AI systems through transparency and rigorous compliance frameworks."
    },
    {
      icon: Target,
      title: "Innovation",
      description: "We push the boundaries of what's possible in AI governance while maintaining the highest standards."
    },
    {
      icon: CheckCircle,
      title: "Compliance Excellence",
      description: "We set the gold standard for AI compliance, ensuring every decision meets regulatory requirements."
    }
  ];

  const team = [
    {
      name: "Damion G Townsend",
      role: "CEO & Founder",
      background: "Marketing and Advertising expert across all major holding companies health verticals",
      image: "/damion-townsend.png",
      initials: "DT"
    },
    {
      name: "Dr. Michael Rodriguez",
      role: "CTO & Co-founder", 
      background: "Former Principal Engineer at Google AI. PhD in Machine Learning from Stanford. Built enterprise AI systems at scale.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      initials: "MR"
    },
    {
      name: "Dr. Emily Watson",
      role: "Head of Compliance",
      background: "Former FDA Digital Health Lead. JD/PhD in Biomedical Engineering. Expert in pharmaceutical AI regulations.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
      initials: "EW"
    }
  ];

  const milestones = [
    {
      year: "2023",
      title: "Platform Launch",
      description: "Successfully launched with Fortune 500 pharmaceutical and financial services customers"
    },
    {
      year: "2023",
      title: "Strategic Partnerships",
      description: "Established partnerships with Microsoft Azure, AWS, and leading compliance software vendors"
    },
    {
      year: "2024",
      title: "Regulatory Framework Support",
      description: "Added support for EU AI Act, FDA Digital Health, and SOX compliance frameworks"
    },
    {
      year: "2024",
      title: "Enterprise Adoption",
      description: "Protecting over 50,000 AI decisions daily across 25+ enterprise customers"
    }
  ];

  const certifications = [
    { name: "SOC 2 Type II", icon: Shield },
    { name: "ISO 27001", icon: Lock },
    { name: "GDPR Compliant", icon: FileCheck },
    { name: "HIPAA Ready", icon: Building2 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Building the Future of{' '}
              <span className="text-primary">AI Governance</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              We're on a mission to make AI innovation safe, compliant, and scalable for the world's most regulated industries.
            </p>
            <div className="bg-card border rounded-lg p-8 text-left">
              <h3 className="text-2xl font-semibold text-foreground mb-4">Our Founding Story</h3>
              <p className="text-muted-foreground leading-relaxed">
                Founded in 2023 by compliance veterans and AI experts who witnessed firsthand the challenges enterprise organizations face when deploying AI systems in regulated environments. After seeing countless AI initiatives stalled by compliance uncertainties, we set out to build the missing infrastructure that makes AI governance as automated and intelligent as the AI systems themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">Mission & Vision</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Our Mission</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To democratize AI governance by making compliance accessible, automated, and intelligent for every organization navigating AI adoption.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A world where AI innovation flourishes within a framework of trust, transparency, and responsibility.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">Core Values</h3>
              {values.map((value, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">{value.title}</h4>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Why We Exist</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-lg p-6">
              <div className="bg-destructive/10 p-3 rounded-lg w-fit mx-auto mb-4">
                <Building2 className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-3">The Challenge</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise AI adoption stalled by compliance uncertainties and manual governance processes that can't keep pace with innovation.
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="bg-orange/10 p-3 rounded-lg w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-orange" />
              </div>
              <h3 className="font-semibold text-foreground mb-3">The Gap</h3>
              <p className="text-sm text-muted-foreground">
                No unified platform existed to automate AI governance across regulatory frameworks while maintaining enterprise security standards.
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-3">Our Solution</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent AI governance that scales with your innovation while ensuring every decision meets compliance requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Leadership Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              World-class experts in AI, compliance, and enterprise software, united by a shared vision of responsible AI innovation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                    <AvatarFallback className="text-lg">{member.initials}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-4">{member.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.background}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Milestones */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Company Milestones</h2>
            <p className="text-muted-foreground">
              Key achievements in our journey to transform AI governance
            </p>
          </div>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  {milestone.year}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Trust & Security</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade security and compliance standards that meet the most stringent requirements
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {certifications.map((cert, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                    <cert.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{cert.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-3">Security Practices</h3>
              <p className="text-sm text-muted-foreground">
                End-to-end encryption, zero-trust architecture, and continuous security monitoring protect your most sensitive data.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-3">Data Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Your data remains in your control with on-premises deployment options and strict data residency compliance.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-3">Advisory Board</h3>
              <p className="text-sm text-muted-foreground">
                Guidance from former regulators, compliance officers, and AI ethics experts from leading global organizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your AI Governance?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the leading enterprises who trust aicomplyr.io to power their AI compliance initiatives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/contact">Contact Sales</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/platform">View Platform Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <NewFooter />
    </div>
  );
};

export default About;