import React, { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import NewFooter from '@/components/NewFooter';
import DemoRequestForm from '@/components/forms/DemoRequestForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  HeadphonesIcon,
  Handshake,
  Building2,
  MessageSquare,
  Globe,
  LogIn
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    industry: '',
    useCase: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log('Form submitted:', formData);
  };

  const contactMethods = [
    {
      type: 'Sales',
      icon: Users,
      title: 'Enterprise Sales',
      description: 'Speak with our enterprise sales team about custom solutions',
      contact: 'sales@aicomplyr.io',
      phone: '+1 (555) 123-4567',
      availability: 'Mon-Fri, 9AM-6PM PST'
    },
    {
      type: 'Support',
      icon: HeadphonesIcon,
      title: 'Technical Support',
      description: 'Get help with implementation and technical questions',
      contact: 'support@aicomplyr.io',
      phone: '+1 (555) 123-4568',
      availability: '24/7 for Enterprise customers'
    },
    {
      type: 'Partnerships',
      icon: Handshake,
      title: 'Strategic Partnerships',
      description: 'Explore partnership and integration opportunities',
      contact: 'partnerships@aicomplyr.io',
      phone: '+1 (555) 123-4569',
      availability: 'Mon-Fri, 9AM-5PM PST'
    }
  ];

  const industries = [
    'Pharmaceutical',
    'Financial Services',
    'Healthcare',
    'Technology',
    'Manufacturing',
    'Government',
    'Education',
    'Other'
  ];

  const useCases = [
    'AI Governance & Compliance',
    'Risk Management',
    'Regulatory Reporting',
    'Partner Network Management',
    'Custom Implementation',
    'Enterprise Integration',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in Touch with Our
              <span className="text-primary block">Enterprise Team</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ready to transform your AI governance? Our experts are here to help you 
              implement enterprise-grade compliance solutions.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Forms */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="demo" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="demo" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Request Demo
                  </TabsTrigger>
                  <TabsTrigger value="inquiry" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    General Inquiry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="demo">
                  <DemoRequestForm source="contact_page" />
                </TabsContent>

                <TabsContent value="inquiry">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl">General Inquiry Form</CardTitle>
                      <p className="text-muted-foreground">
                        Questions about our platform, partnerships, or other inquiries
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="John Smith"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company *</Label>
                            <Input
                              id="company"
                              value={formData.company}
                              onChange={(e) => handleInputChange('company', e.target.value)}
                              placeholder="Acme Corporation"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="industry">Industry *</Label>
                            <Select onValueChange={(value) => handleInputChange('industry', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {industries.map((industry) => (
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="useCase">Primary Use Case *</Label>
                            <Select onValueChange={(value) => handleInputChange('useCase', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your use case" />
                              </SelectTrigger>
                              <SelectContent>
                                {useCases.map((useCase) => (
                                  <SelectItem key={useCase} value={useCase}>
                                    {useCase}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            placeholder="Tell us about your inquiry..."
                            rows={5}
                            required
                          />
                        </div>

                        <Button type="submit" size="lg" className="w-full md:w-auto">
                          Send Inquiry
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Existing Customer Login */}
              <Card className="mt-8 shadow-lg border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5 text-primary" />
                    Existing Customer?
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Access your AI governance platform dashboard
                  </p>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/auth">
                      Customer Portal Login
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Methods & Company Info */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <method.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{method.title}</h3>
                            <Badge variant="secondary">{method.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {method.description}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary" />
                              <a href={`mailto:${method.contact}`} className="text-primary hover:underline">
                                {method.contact}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary" />
                              <a href={`tel:${method.phone}`} className="text-primary hover:underline">
                                {method.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{method.availability}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Headquarters</div>
                      <div className="text-sm text-muted-foreground">
                        123 Innovation Drive<br />
                        San Francisco, CA 94105<br />
                        United States
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Main Office</div>
                      <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">General Inquiries</div>
                      <div className="text-sm text-muted-foreground">info@aicomplyr.io</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="font-medium mb-2">Business Hours</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Monday - Friday: 9:00 AM - 6:00 PM PST</div>
                      <div>Saturday - Sunday: Closed</div>
                      <div className="text-primary">Enterprise Support: 24/7</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <NewFooter />
    </div>
  );
};

export default Contact;