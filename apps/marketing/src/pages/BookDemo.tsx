import React, { useState, useEffect } from 'react';
import { BoundaryNav } from '@/components/boundary/BoundaryNav';
import { BoundaryFooter } from '@/components/boundary/BoundaryFooter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Check, Shield, Clock, MessageSquare } from 'lucide-react';
import { bookDemoContent } from '@/content/bookDemoContent';
import { trackEvent } from '@/utils/analytics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BookDemo = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    aiToolsCount: '',
    challenge: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  useEffect(() => {
    document.title = 'Book a Boundary Governance Session | AIComplyr';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Schedule a personalized demo of aicomply.io\'s boundary governance platform. See how we sync AI tool policies to partner workspaces and generate audit-ready proof.'
      );
    }
    
    trackEvent('book_demo_page_view', { referrer: document.referrer });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('book_demo_form_start');
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      trackEvent('book_demo_form_submit', {
        company: formData.company,
        ai_tools_count: formData.aiToolsCount,
        has_challenge: !!formData.challenge
      });

      const { error } = await supabase
        .from('demo_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone || null,
          message: formData.challenge || null,
        });

      if (error) throw error;

      trackEvent('book_demo_form_success');
      toast.success('Demo request submitted! We\'ll be in touch soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        aiToolsCount: '',
        challenge: '',
      });
      setFormStarted(false);
    } catch (error) {
      console.error('Error submitting demo request:', error);
      trackEvent('book_demo_form_error', { error: String(error) });
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BoundaryNav />
      
      {/* Hero Section */}
      <section className="bg-gray-50 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4">
            {bookDemoContent.breadcrumb}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-solution">
            {bookDemoContent.hero.headline}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {bookDemoContent.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bookDemoContent.trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon === 'Shield' ? Shield : indicator.icon === 'Clock' ? Clock : MessageSquare;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {indicator.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {indicator.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - What to Expect */}
            <div className="space-y-6">
              <Card className="p-8 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-solution">
                  {bookDemoContent.whatToExpect.title}
                </h2>
                <div className="space-y-4">
                  {bookDemoContent.whatToExpect.items.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-solution">
                  {bookDemoContent.demoDetails.title}
                </h2>
                <div className="space-y-4">
                  {bookDemoContent.demoDetails.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Booking Form */}
            <div>
              <Card className="p-8 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-2xl font-bold text-foreground mb-2 font-solution">
                  {bookDemoContent.form.title}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {bookDemoContent.form.subtitle}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Doe"
                      className="focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                      Work Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@company.com"
                      className="focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1.5">
                      Company Name *
                    </label>
                    <Input
                      id="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Acme Corp"
                      className="focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="aiTools" className="block text-sm font-medium text-foreground mb-1.5">
                      Number of AI Tools in Use
                    </label>
                    <Input
                      id="aiTools"
                      type="text"
                      value={formData.aiToolsCount}
                      onChange={(e) => handleInputChange('aiToolsCount', e.target.value)}
                      placeholder="e.g., 5-10"
                      className="focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="challenge" className="block text-sm font-medium text-foreground mb-1.5">
                      Primary Challenge or Use Case
                    </label>
                    <Textarea
                      id="challenge"
                      rows={4}
                      value={formData.challenge}
                      onChange={(e) => handleInputChange('challenge', e.target.value)}
                      placeholder="Tell us about your AI governance needs..."
                      className="resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                      maxLength={500}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 min-h-[44px]"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Submitting...' : bookDemoContent.form.submitButton}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {bookDemoContent.form.privacyNote}
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <BoundaryFooter />
    </div>
  );
};

export default BookDemo;
