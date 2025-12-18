import { useState, useEffect, useRef } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import NewFooter from '@/components/NewFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Building2, Users, Target, Phone, Download, Eye, X, Clock, TrendingUp, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AIAgentIntelligence from '@/components/pharmaceutical/AIAgentIntelligence';
import TechnicalDifferentiation from '@/components/pharmaceutical/TechnicalDifferentiation';
import IntelligenceDemo from '@/components/pharmaceutical/IntelligenceDemo';
import { AIToolReadinessAssessment } from '@/components/pharmaceutical/AIToolReadinessAssessment';
import { AIToolApprovalWorkflow } from '@/components/pharmaceutical/AIToolApprovalWorkflow';
import { LiveROICalculator } from '@/components/pharmaceutical/LiveROICalculator';
import { LiveSocialProof } from '@/components/pharmaceutical/LiveSocialProof';
import { AIToolRiskDashboard } from '@/components/pharmaceutical/AIToolRiskDashboard';

const PharmaceuticalIndustry = () => {
  // Stats animation state
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  const stats = [
    {
      number: 73,
      unit: "%",
      label: "of pharma companies can't track which AI tools their teams are actually using",
      context: "Shadow AI adoption is creating massive governance gaps",
      microCTA: { text: "Assess Your Tool Governance →", link: "#governance-assessment" }
    },
    {
      number: 2.8,
      unit: "B",
      prefix: "$",
      label: "lost annually due to AI tool approval delays in drug development",
      context: "Teams wait months for tool approval while competitors move ahead"
    },
    {
      number: 45,
      unit: "",
      label: "days average time for AI tool approval without governance platform",
      context: "Reduced to 5 days with automated vendor risk assessment"
    },
    {
      number: 23,
      unit: "",
      label: "average number of different AI tools used per pharmaceutical company",
      context: "Most companies can only track 6 of them properly"
    }
  ];

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateStats();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, stats]);

  const animateStats = () => {
    stats.forEach((stat, index) => {
      let start = Date.now();
      const duration = 2000 + (index * 200); // Stagger animations
      const targetValue = stat.number;
      
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = easeOut * targetValue;
        
        setAnimatedStats(prev => {
          const newStats = [...prev];
          newStats[index] = currentValue;
          return newStats;
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    });
  };

  const painPoints = [
    {
      title: "For Pharmaceutical Companies",
      icon: Building2,
      points: [
        { issue: "AI Tool Proliferation", detail: "Teams are using 20+ different AI tools - which ones meet your security requirements?" },
        { issue: "Vendor Risk Assessment", detail: "How do you evaluate if ChatGPT Enterprise or Claude meets your data governance policies?" },
        { issue: "Multi-Partner Tool Management", detail: "Clinical trials involve 15+ CROs using different AI tools - who's tracking governance?" },
        { issue: "Tool Approval Bottlenecks", detail: "AI tool requests take 45+ days to approve - innovation teams can't wait that long" }
      ]
    },
    {
      title: "For Marketing Agencies & CROs",
      icon: Users,
      points: [
        { issue: "Client AI Tool Restrictions", detail: "Each pharma client has different approved AI tool lists - how do you manage governance across accounts?" },
        { issue: "Tool Usage Tracking", detail: "You need to prove which AI tools were used for which client deliverables - where's the audit trail?" },
        { issue: "Vendor Contract Liability", detail: "Using non-approved AI tools risks contract violations and liability exposure" },
        { issue: "Scalable Tool Governance", detail: "Managing AI tool policies across 50+ pharma clients manually is impossible" }
      ]
    }
  ];

  const governanceFrameworks = [
    {
      title: "Tool Discovery & Inventory",
      icon: "🔍",
      requirement: "Complete visibility into all AI tools in use across organization",
      solution: "Automated tool discovery, usage tracking, shadow AI detection",
      proof: "Live tool portfolio dashboard"
    },
    {
      title: "Vendor Risk Assessment",
      icon: "🛡️",
      requirement: "Comprehensive evaluation of AI vendor security and compliance",
      solution: "Automated vendor intelligence, security scoring, contract analysis",
      proof: "Real-time vendor risk dashboard"
    },
    {
      title: "Approval Workflow",
      icon: "⚡",
      requirement: "Efficient tool approval with stakeholder routing and documentation",
      solution: "Automated workflows, risk-based approvals, audit trail generation",
      proof: "Multi-stakeholder approval demo"
    },
    {
      title: "Governance Monitoring",
      icon: "📊",
      requirement: "Continuous monitoring of tool usage and policy compliance",
      solution: "Real-time monitoring, policy enforcement, automated reporting",
      proof: "Live governance metrics dashboard"
    }
  ];

  const caseStudies = [
    {
      type: "Global Pharma Success",
      title: "How a Top 10 Pharma Company Achieved 60% Faster AI Tool Approval",
      metrics: [
        { value: "60%", label: "Faster Approvals" },
        { value: "100%", label: "FDA Audit Success" },
        { value: "$12M", label: "Timeline Savings" }
      ],
      quote: "The platform transformed our AI governance from a bottleneck into a competitive advantage. We went from 45-day approval cycles to 18 days, with complete audit readiness.",
      attribution: "Chief Digital Officer, Fortune 500 Pharmaceutical Company"
    },
    {
      type: "CRO Scale Success", 
      title: "Leading CRO Manages AI Compliance Across 200+ Clinical Trials",
      metrics: [
        { value: "95%", label: "Time Reduction" },
        { value: "0", label: "Citations" },
        { value: "40%", label: "Client Satisfaction ↑" }
      ],
      quote: "Managing different AI policies for 15+ pharma clients was impossible manually. Now we have consistent governance across all trials with zero governance violations.",
      attribution: "VP of Quality Assurance, Leading Clinical Research Organization"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
    
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="pharma-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(#pharma-pattern)"/></svg>')}")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The Only AI Tool Governance Platform Built for Pharmaceutical Companies
            </h1>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Track, approve, and manage every AI tool in your organization with complete FDA compliance transparency.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                ✅ AI Tool Portfolio Tracking
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                ✅ Automated Vendor Risk Assessment
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                ✅ 5-Day Tool Approval Process
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                ✅ Multi-Partner Tool Governance
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                See AI Tool Governance in Action
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Download Tool Governance Guide
              </Button>
            </div>
          </div>
          
        {/* Live Demo Widget */}
        <div className="space-y-6">
          <AIToolRiskDashboard />
        </div>
        </div>
      </section>

      {/* AI Tool Approval Demo Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">See AI Tool Approval in Action</h2>
            <p className="text-xl text-muted-foreground">Submit a tool request and watch real-time governance workflow</p>
          </div>
          <AIToolApprovalWorkflow />
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" ref={statsRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The $50 Billion AI Tool Governance Crisis
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pharmaceutical companies are losing billions because they can't track and govern 
              their AI tool usage. Here's the real cost of shadow AI adoption.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <CardContent className="space-y-4">
                    <div className="text-4xl md:text-5xl font-bold text-primary">
                      {stat.prefix}{Math.round(animatedStats[index])}{stat.unit}
                    </div>
                    <div className="text-lg font-semibold text-foreground leading-tight">
                      {stat.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.context}
                    </div>
                    {stat.microCTA && (
                      <a 
                        href={stat.microCTA.link}
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {stat.microCTA.text}
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              The AI Tool Governance Challenge Every Pharma Leader Faces
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Innovation teams need AI tools to compete. Compliance teams need visibility and control. 
              Current manual processes make both impossible.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {painPoints.map((section, index) => (
              <Card key={index} className="p-8">
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <section.icon className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-bold">{section.title}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {section.points.map((point, pointIndex) => (
                      <div key={pointIndex} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-lg">{point.issue}</div>
                            <div className="text-muted-foreground">{point.detail}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live ROI Calculator Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Calculate Your AI Tool Governance ROI</h2>
            <p className="text-xl text-muted-foreground">See the real financial impact of automated AI tool management with live industry data</p>
          </div>
          <LiveROICalculator />
        </div>
      </section>

      {/* FDA Regulatory Framework Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Complete AI Tools Governance Framework
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              End-to-end governance covering discovery, assessment, approval, and monitoring of AI tools.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {governanceFrameworks.map((framework, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{framework.icon}</span>
                    <h3 className="text-xl font-bold">{framework.title}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-600 mb-1">Governance Challenge</div>
                      <div className="text-sm text-muted-foreground">{framework.requirement}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-semibold text-green-600 mb-1">How aicomply.io Delivers</div>
                      <div className="text-sm text-muted-foreground">{framework.solution}</div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      {framework.proof}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Social Proof Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Live Industry Activity</h2>
            <p className="text-xl text-muted-foreground">Real-time demonstrations from pharmaceutical leaders worldwide</p>
          </div>
          <LiveSocialProof />
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Proven Results from Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how pharmaceutical companies and CROs are transforming their AI governance with measurable results.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {caseStudies.map((study, index) => (
              <Card key={index} className="p-8">
                <CardContent className="space-y-6">
                  <div>
                    <Badge variant="secondary" className="mb-3">{study.type}</Badge>
                    <h3 className="text-xl font-bold">{study.title}</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {study.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="text-center">
                        <div className="text-2xl font-bold text-primary">{metric.value}</div>
                        <div className="text-sm text-muted-foreground">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                    "{study.quote}"
                  </blockquote>
                  
                  <div className="text-sm font-medium">
                    — {study.attribution}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Demo Section */}
      <IntelligenceDemo />

      {/* AI Agent Intelligence Section */}
      <AIAgentIntelligence />

      {/* Technical Differentiation Section */}
      <TechnicalDifferentiation />

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your AI Governance?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the pharmaceutical leaders who are already using aicomplyr.io to accelerate innovation while ensuring FDA compliance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              Schedule Executive Demo
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Start Free Assessment
            </Button>
          </div>
          
          <div className="mt-8 text-sm opacity-75">
            <p>✅ No implementation required • ✅ See results in 30 minutes • ✅ Full FDA audit trail included</p>
          </div>
        </div>
      </section>

      <NewFooter />
    </div>
  );
};

export default PharmaceuticalIndustry;