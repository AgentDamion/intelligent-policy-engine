import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TrendingUp, Clock, Shield } from 'lucide-react';

interface ROICalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROICalculatorModal: React.FC<ROICalculatorModalProps> = ({ open, onOpenChange }) => {
  const [aiTools, setAiTools] = useState(12);
  const [partners, setPartners] = useState(8);
  const [programValue, setProgramValue] = useState(150);

  // ROI Calculation Logic
  const calculateROI = () => {
    const baseTimeSavings = aiTools * 27; // days saved per tool
    const totalTimeSavings = baseTimeSavings;
    const riskReduction = Math.min(90, aiTools * 7.5); // max 90%
    const efficiencyGain = Math.min(75, aiTools * 6.25); // max 75%
    const costSavings = (aiTools * programValue * 0.015) + (partners * 50); // $M
    
    return {
      totalROI: costSavings.toFixed(1),
      timeline: totalTimeSavings,
      risk: Math.round(riskReduction),
      efficiency: Math.round(efficiencyGain)
    };
  };

  const roi = calculateROI();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calculator className="w-6 h-6 text-primary" />
            ROI Calculator
          </DialogTitle>
          <DialogDescription>
            Estimate your potential savings and efficiency gains with AI governance automation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Controls */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">AI Tools in Development</label>
                <span className="text-sm font-bold text-primary">{aiTools}</span>
              </div>
              <Slider
                value={[aiTools]}
                onValueChange={(value) => setAiTools(value[0])}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">External Partners</label>
                <span className="text-sm font-bold text-primary">{partners}</span>
              </div>
              <Slider
                value={[partners]}
                onValueChange={(value) => setPartners(value[0])}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Average Program Value</label>
                <span className="text-sm font-bold text-primary">${programValue}M</span>
              </div>
              <Slider
                value={[programValue]}
                onValueChange={(value) => setProgramValue(value[0])}
                min={10}
                max={500}
                step={10}
                className="w-full"
              />
            </div>
          </div>

          {/* Results Display */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary mb-2">
                  ${roi.totalROI}M
                </div>
                <div className="text-sm text-muted-foreground">Estimated Annual Savings</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-primary mr-2" />
                  </div>
                  <div className="text-2xl font-bold text-primary">{roi.timeline}</div>
                  <div className="text-xs text-muted-foreground">Days Saved</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5 text-primary mr-2" />
                  </div>
                  <div className="text-2xl font-bold text-primary">{roi.risk}%</div>
                  <div className="text-xs text-muted-foreground">Risk Reduction</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-primary mr-2" />
                  </div>
                  <div className="text-2xl font-bold text-primary">{roi.efficiency}%</div>
                  <div className="text-xs text-muted-foreground">Efficiency Gain</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="flex gap-4">
            <Button 
              className="flex-1 bg-teal hover:bg-teal/90 text-white"
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/contact?type=roi-consultation';
              }}
            >
              Schedule ROI Consultation
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ROICalculatorModal;
