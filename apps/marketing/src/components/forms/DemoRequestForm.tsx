import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, Building2, Globe, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoRequestFormProps {
  source?: string;
  className?: string;
}

const DemoRequestForm: React.FC<DemoRequestFormProps> = ({ 
  source = 'contact_form',
  className = ''
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companySize: '',
    industry: '',
    useCase: '',
    demoType: 'executive_overview',
    preferredTime: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('demo_requests')
        .insert([{
          name: formData.name,
          email: formData.email,
          company: formData.company,
          company_size: formData.companySize,
          industry: formData.industry,
          use_case: formData.useCase,
          demo_type: formData.demoType,
          preferred_time: formData.preferredTime,
          phone: formData.phone,
          message: formData.message,
          source: source
        }]);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Demo request submitted successfully! We\'ll be in touch within 24 hours.');
    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast.error('Failed to submit demo request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const industries = [
    'Pharmaceutical',
    'Financial Services',
    'Healthcare',
    'Technology',
    'Manufacturing',
    'Government',
    'Education',
    'Marketing Services',
    'Other'
  ];

  const companySizes = [
    '1-50 employees',
    '51-200 employees', 
    '201-1000 employees',
    '1000+ employees'
  ];

  const useCases = [
    'AI Governance & Compliance',
    'Risk Management',
    'Regulatory Reporting',
    'Partner Network Management',
    'Custom Implementation',
    'Enterprise Integration',
    'FDA Compliance',
    'Multi-client Agency Management',
    'Other'
  ];

  const demoTypes = [
    {
      id: 'executive_overview',
      title: 'Executive Overview',
      duration: '30 minutes',
      description: 'High-level platform overview for decision makers',
      icon: Clock
    },
    {
      id: 'technical_deep_dive',
      title: 'Technical Deep Dive',
      duration: '60 minutes',
      description: 'Detailed technical demonstration for implementation teams',
      icon: Building2
    },
    {
      id: 'custom_implementation',
      title: 'Custom Implementation',
      duration: '90 minutes',
      description: 'Tailored demo focused on your specific use case',
      icon: Globe
    }
  ];

  if (isSubmitted) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Demo Request Submitted!</h3>
          <p className="text-muted-foreground mb-4">
            Thank you for your interest in our enterprise AI governance platform. 
            Our sales team will contact you within 24 hours to schedule your personalized demo.
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your email for a confirmation message with next steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Request Enterprise Demo
        </CardTitle>
        <p className="text-muted-foreground">
          Get a personalized demonstration of our AI governance platform tailored to your organization's needs.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact Information</h4>
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Company Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size *</Label>
                <Select onValueChange={(value) => handleInputChange('companySize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="useCase">Primary Use Case *</Label>
              <Select onValueChange={(value) => handleInputChange('useCase', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary use case" />
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

          {/* Demo Type Selection */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Demo Type</h4>
            <RadioGroup
              value={formData.demoType}
              onValueChange={(value) => handleInputChange('demoType', value)}
              className="space-y-3"
            >
              {demoTypes.map((demo) => (
                <div key={demo.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value={demo.id} id={demo.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={demo.id} className="flex items-center gap-2 font-medium cursor-pointer">
                      <demo.icon className="h-4 w-4 text-primary" />
                      {demo.title}
                      <span className="text-sm text-muted-foreground">({demo.duration})</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{demo.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Additional Information</h4>
            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input
                id="preferredTime"
                value={formData.preferredTime}
                onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                placeholder="e.g., Next week, Tuesday afternoons, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us about your specific AI governance challenges and what you'd like to see in the demo..."
                rows={4}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full md:w-auto" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Request Demo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DemoRequestForm;