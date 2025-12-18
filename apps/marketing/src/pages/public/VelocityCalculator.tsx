import React, { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SpecBadge from '@/components/ui/SpecBadge';
import { Calculator, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const VelocityCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    aiTools: 12,
    partners: 8,
    programValue: 150,
    email: ''
  });

  const calculateROI = () => {
    const timeReduction = Math.round(formData.aiTools * 2.25 + formData.partners * 1.5);
    const costSavings = Math.round((formData.programValue * 0.14) * 100) / 100;
    const riskReduction = Math.min(90, formData.aiTools * 7 + formData.partners * 3);
    
    return {
      timeReduction,
      costSavings,
      riskReduction,
      efficiency: Math.round((timeReduction / 45) * 100)
    };
  };

  const roi = calculateROI();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      toast.success('ROI report sent to your email!');
      setFormData(prev => ({ ...prev, email: '' }));
    }, 1000);
    
    console.log('ROI calculation submitted:', { formData, roi });
  };

  return (
    <StandardPageLayout
      title="AI Compliance Velocity Calculator"
      description="Calculate potential time and cost savings with AI-powered compliance automation"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Calculator className="h-12 w-12 text-primary" />
            <SpecBadge id="B2" />
          </div>
          <h1 className="text-3xl font-bold">Compliance Velocity Calculator</h1>
          <p className="text-muted-foreground mt-2">
            See how much time and money you could save with AI-powered compliance automation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Your Current Situation</CardTitle>
              <CardDescription>
                Tell us about your AI tools and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="aiTools">AI Tools in Development</Label>
                <Input
                  id="aiTools"
                  type="number"
                  value={formData.aiTools}
                  onChange={(e) => handleInputChange('aiTools', parseInt(e.target.value) || 0)}
                  min="1"
                  max="50"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Number of AI tools or models requiring compliance review
                </p>
              </div>

              <div>
                <Label htmlFor="partners">External Partners</Label>
                <Input
                  id="partners"
                  type="number"
                  value={formData.partners}
                  onChange={(e) => handleInputChange('partners', parseInt(e.target.value) || 0)}
                  min="1"
                  max="20"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Third-party vendors requiring compliance validation
                </p>
              </div>

              <div>
                <Label htmlFor="programValue">Average Program Value ($M)</Label>
                <Input
                  id="programValue"
                  type="number"
                  value={formData.programValue}
                  onChange={(e) => handleInputChange('programValue', parseInt(e.target.value) || 0)}
                  min="10"
                  max="500"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Typical value of programs requiring compliance approval
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Potential Savings</CardTitle>
              <CardDescription>
                Estimated impact of AI-powered compliance automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">{roi.timeReduction}</div>
                  <div className="text-sm text-muted-foreground">Days Saved</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <TrendingUp className="mx-auto h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">${roi.costSavings}M</div>
                  <div className="text-sm text-muted-foreground">Cost Savings</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Risk Reduction:</span>
                  <span className="font-semibold">{roi.riskReduction}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency Gain:</span>
                  <span className="font-semibold">{roi.efficiency}%</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6">
                <div className="mb-4">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@company.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Get Detailed ROI Report
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default VelocityCalculator;