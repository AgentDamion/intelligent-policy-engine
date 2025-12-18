import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Video, 
  Calendar, 
  Download, 
  PlayCircle,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';

const Resources: React.FC = () => {
  const guides = [
    {
      title: 'FDA AI/ML Guidance Compliance Checklist',
      description: 'Complete checklist for ensuring your AI tools meet FDA AI/ML software guidance requirements',
      type: 'Guide',
      readTime: '15 min read',
      downloads: 1247,
      category: 'Regulatory'
    },
    {
      title: 'Enterprise AI Governance Framework',
      description: 'Step-by-step framework for implementing AI governance in large organizations',
      type: 'Framework',
      readTime: '25 min read',
      downloads: 892,
      category: 'Governance'
    },
    {
      title: 'GDPR Compliance for AI Systems',
      description: 'Navigate GDPR requirements for AI-powered applications and data processing',
      type: 'Guide',
      readTime: '20 min read',
      downloads: 756,
      category: 'Privacy'
    },
    {
      title: 'AI Risk Assessment Template',
      description: 'Comprehensive template for assessing and documenting AI system risks',
      type: 'Template',
      readTime: '10 min setup',
      downloads: 634,
      category: 'Risk Management'
    }
  ];

  const webinars = [
    {
      title: 'Navigating FDA AI/ML Guidance: What Pharma Needs to Know',
      description: 'Deep dive into FDA guidance with real-world implementation examples',
      duration: '45 minutes',
      date: 'February 15, 2024',
      attendees: 340,
      status: 'Upcoming'
    },
    {
      title: 'Building Compliant AI Systems from Day One',
      description: 'Best practices for embedding compliance into your AI development lifecycle',
      duration: '60 minutes',
      date: 'January 18, 2024',
      attendees: 287,
      status: 'On Demand'
    },
    {
      title: 'Enterprise AI Governance: Lessons from Industry Leaders',
      description: 'Panel discussion with compliance leaders from Fortune 500 companies',
      duration: '55 minutes',
      date: 'December 14, 2023',
      attendees: 195,
      status: 'On Demand'
    }
  ];

  const caseStudies = [
    {
      title: 'How Acme Pharma Reduced Compliance Time by 60%',
      company: 'Fortune 500 Pharmaceutical',
      challenge: 'Complex FDA validation requirements',
      solution: 'Automated compliance documentation',
      results: ['60% faster validation', '$2.8M cost savings', '100% audit success'],
      industry: 'Pharmaceutical'
    },
    {
      title: 'FinTech Startup Achieves SOX Compliance in 30 Days',
      company: 'Series B Financial Technology',
      challenge: 'SOX compliance for AI trading algorithms',
      solution: 'Real-time risk monitoring',
      results: ['30-day compliance', '85% risk reduction', 'Successful IPO'],
      industry: 'Financial Services'
    }
  ];

  return (
    <StandardPageLayout
      title="Resources"
      description="Guides, templates, webinars, and case studies to help you navigate AI compliance"
    >
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            AI Compliance Resources
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to understand and implement AI compliance in your organization. 
            From regulatory guides to real-world case studies.
          </p>
        </div>

        {/* Resource Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Guides & Templates</CardTitle>
              <CardDescription>Practical resources for implementation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guides.length}</div>
              <p className="text-sm text-muted-foreground">Available downloads</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Video className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Webinars & Training</CardTitle>
              <CardDescription>Expert insights and training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webinars.length}</div>
              <p className="text-sm text-muted-foreground">Educational sessions</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Case Studies</CardTitle>
              <CardDescription>Real-world success stories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caseStudies.length}</div>
              <p className="text-sm text-muted-foreground">Customer stories</p>
            </CardContent>
          </Card>
        </div>

        {/* Guides & Templates */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Guides & Templates</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {guides.map((guide, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">{guide.category}</Badge>
                    <Badge variant="secondary">{guide.type}</Badge>
                  </div>
                  <CardTitle className="text-xl">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {guide.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {guide.downloads} downloads
                      </div>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Guide
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Webinars & Training */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Webinars & Training</h2>
          </div>
          
          <div className="space-y-4">
            {webinars.map((webinar, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{webinar.title}</h3>
                        <Badge variant={webinar.status === 'Upcoming' ? 'default' : 'secondary'}>
                          {webinar.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{webinar.description}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {webinar.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {webinar.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {webinar.attendees} attendees
                        </div>
                      </div>
                    </div>
                    <Button className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      {webinar.status === 'Upcoming' ? 'Register' : 'Watch'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Case Studies */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Case Studies</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {caseStudies.map((study, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">{study.industry}</Badge>
                  <CardTitle className="text-xl">{study.title}</CardTitle>
                  <CardDescription>{study.company}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Challenge</h4>
                    <p className="text-sm text-muted-foreground">{study.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Solution</h4>
                    <p className="text-sm text-muted-foreground">{study.solution}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Results</h4>
                    <ul className="space-y-1">
                      {study.results.map((result, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read Full Case Study
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-12 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-lg">
          <h2 className="text-3xl font-bold">Need Personalized Guidance?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our compliance experts can provide tailored advice for your specific use case and regulatory requirements
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Schedule Expert Consultation
            </Button>
            <Button size="lg" variant="outline">
              Join Our Community
            </Button>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default Resources;