import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Link } from 'react-router-dom';
import { alternate3Content } from '@/content/alternate3ProofFirst';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const ProofCalculator = () => {
  const { calculator } = alternate3Content;
  
  const [values, setValues] = useState<Record<string, number>>({
    assetsPerMonth: 20,
    minutesPerAsset: 90,
    peopleInvolved: 5,
    reworkPercent: 30
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    name: '',
    company: ''
  });

  useEffect(() => {
    if (hasStarted) {
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: 'calculator_completed' }
      }));
    }
  }, [values, hasStarted]);

  const handleValueChange = (id: string, newValue: number[]) => {
    if (!hasStarted) {
      setHasStarted(true);
      window.dispatchEvent(new CustomEvent('analytics', {
        detail: { event: 'calculator_started' }
      }));
    }
    setValues(prev => ({ ...prev, [id]: newValue[0] }));
  };

  // Calculate outputs
  const currentTimePerMonth = values.assetsPerMonth * values.minutesPerAsset;
  const newTimePerMonth = values.assetsPerMonth * 15; // Assume 15 min with platform
  const timeSavedHours = Math.round((currentTimePerMonth - newTimePerMonth) / 60);
  const reworkReduction = Math.round(values.reworkPercent * 0.8); // 80% reduction
  const cycleCompressionDays = Math.round((currentTimePerMonth / (values.peopleInvolved * 8 * 60)) * 5);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { 
        event: 'calc_email_results_clicked',
        properties: emailFormData
      }
    }));
    toast.success('Results will be sent to your email shortly!');
    setEmailDialogOpen(false);
    setEmailFormData({ email: '', name: '', company: '' });
  };

  return (
    <section id="proof-calculator" className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            {calculator.sectionTitle}
          </h2>
          <p className="text-lg text-muted-foreground">
            {calculator.description}
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Calculate Your Time Savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inputs */}
            {calculator.inputs.map((input) => (
              <div key={input.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    {input.label}
                  </label>
                  <span className="text-lg font-bold text-brand-teal">
                    {values[input.id]}{input.id === 'reworkPercent' ? '%' : ''}
                  </span>
                </div>
                <Slider
                  value={[values[input.id]]}
                  onValueChange={(val) => handleValueChange(input.id, val)}
                  min={input.min}
                  max={input.max}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}

            {/* Outputs */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-brand-teal/10 rounded-lg">
                  <div className="text-3xl font-bold text-brand-teal mb-1">
                    {timeSavedHours}h
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {calculator.outputs.timeSaved}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-brand-teal/10 rounded-lg">
                  <div className="text-3xl font-bold text-brand-teal mb-1">
                    {reworkReduction}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {calculator.outputs.fewerRework}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-brand-teal/10 rounded-lg">
                  <div className="text-3xl font-bold text-brand-teal mb-1">
                    {cycleCompressionDays}d
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {calculator.outputs.cycleCompression}
                  </div>
                </div>
              </div>

              <Button asChild size="lg" className="w-full focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2" onClick={() => {
                window.dispatchEvent(new CustomEvent('analytics', {
                  detail: { event: calculator.cta.event }
                }));
              }}>
                <Link to={calculator.cta.href}>
                  {calculator.cta.text}
                </Link>
              </Button>

              {/* Email Results Option */}
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-sm text-brand-teal hover:underline mt-2 focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 rounded px-2 py-1">
                    Email me these results
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Email Your Results</DialogTitle>
                    <DialogDescription>
                      We'll send your time savings calculation to your email.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={emailFormData.email}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={emailFormData.name}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your company"
                        value={emailFormData.company}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2">
                      Send Results
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          
          <div className="px-6 pb-6">
            <p className="text-xs text-muted-foreground text-center">
              Estimates based on average time savings across enterprise implementations. Actual results may vary based on complexity and team size.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
