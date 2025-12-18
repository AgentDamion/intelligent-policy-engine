import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Clock, Shield } from 'lucide-react';
import CountUp from 'react-countup';

const InteractiveROICalculator = () => {
  const [sliders, setSliders] = useState({
    agencies: 8,
    hoursPerWeek: 15,
    fteCost: 150000,
    auditsPerYear: 12,
  });

  const calculateROI = useMemo(() => {
    const weeklyDoc = sliders.hoursPerWeek * (sliders.fteCost / 2080);
    const annualDoc = weeklyDoc * 52;
    const auditPrep = sliders.auditsPerYear * 12 * (sliders.fteCost / 2080);
    const policyMgmt = sliders.agencies * 425;
    const total = annualDoc + auditPrep + policyMgmt;
    const savings = total * 0.7;

    return {
      total: Math.round(total),
      savings: Math.round(savings),
      breakdown: {
        documentation: Math.round(annualDoc),
        auditPrep: Math.round(auditPrep),
        policyMgmt: Math.round(policyMgmt),
      },
    };
  }, [sliders]);

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            What's Your Annual Compliance Overhead?
          </h2>
          <p className="text-xl text-muted-foreground">
            Move the sliders to calculate the hidden cost of manual AI governance:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Input Controls */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-foreground mb-6">Your Current Situation</h3>
            <div className="space-y-8">
              {/* Slider 1: Agencies */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Agency partners you work with:</label>
                  <span className="text-2xl font-bold text-[hsl(var(--brand-teal))]">
                    {sliders.agencies}
                  </span>
                </div>
                <Slider
                  value={[sliders.agencies]}
                  onValueChange={(value) => setSliders({ ...sliders, agencies: value[0] })}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                  data-track="calculator-slider-agencies"
                />
              </div>

              {/* Slider 2: Hours per Week */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Hours/week on compliance documentation:</label>
                  <span className="text-2xl font-bold text-[hsl(var(--brand-teal))]">
                    {sliders.hoursPerWeek}
                  </span>
                </div>
                <Slider
                  value={[sliders.hoursPerWeek]}
                  onValueChange={(value) => setSliders({ ...sliders, hoursPerWeek: value[0] })}
                  min={5}
                  max={40}
                  step={1}
                  className="w-full"
                  data-track="calculator-slider-hours"
                />
              </div>

              {/* Slider 3: FTE Cost */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Fully-loaded cost per compliance FTE:</label>
                  <span className="text-2xl font-bold text-[hsl(var(--brand-teal))]">
                    ${(sliders.fteCost / 1000).toFixed(0)}K
                  </span>
                </div>
                <Slider
                  value={[sliders.fteCost]}
                  onValueChange={(value) => setSliders({ ...sliders, fteCost: value[0] })}
                  min={100000}
                  max={250000}
                  step={10000}
                  className="w-full"
                  data-track="calculator-slider-fte-cost"
                />
              </div>

              {/* Slider 4: Audits per Year */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Audits/reviews per year:</label>
                  <span className="text-2xl font-bold text-[hsl(var(--brand-teal))]">
                    {sliders.auditsPerYear}
                  </span>
                </div>
                <Slider
                  value={[sliders.auditsPerYear]}
                  onValueChange={(value) => setSliders({ ...sliders, auditsPerYear: value[0] })}
                  min={2}
                  max={50}
                  step={1}
                  className="w-full"
                  data-track="calculator-slider-audits"
                />
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Calculate My Overhead →
              </Button>
            </div>
          </div>

          {/* Right Side: Results */}
          <div className="space-y-6 bg-white rounded-lg shadow-xl p-2">
            {/* Current Overhead */}
            <Card className="border-2 border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-destructive" />
                  Your Current Annual Overhead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-bold text-red-600 mb-6">
                  $<CountUp end={calculateROI.total} duration={0.5} separator="," />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Documentation time:
                    </span>
                    <span className="font-semibold">
                      ${calculateROI.breakdown.documentation.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Audit preparation:
                    </span>
                    <span className="font-semibold">
                      ${calculateROI.breakdown.auditPrep.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Policy management:
                    </span>
                    <span className="font-semibold">
                      ${calculateROI.breakdown.policyMgmt.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Potential Savings */}
            <Card className="border-2 border-[hsl(var(--brand-teal))]/30 bg-[hsl(var(--brand-teal))]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--brand-teal))]" />
                  With Executable Policy Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-green-600 mb-2">
                  $<CountUp end={calculateROI.savings} duration={0.5} separator="," />
                </div>
                <p className="text-sm text-muted-foreground mb-6">saved annually</p>
                <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--brand-teal))]" />
                  <span className="font-semibold text-lg">↓ 70% reduction</span>
                  <span className="text-sm text-muted-foreground">in manual overhead</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white"
              data-track="calculator-cta-download"
            >
              Download WP#1 to See the Framework
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveROICalculator;
