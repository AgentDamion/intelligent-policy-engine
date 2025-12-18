import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Clock, Shield, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ROIInputs {
  aiTools: number;
  partners: number;
  programValue: number;
  currentProcessTime: number;
}

interface ROIResults {
  totalSavings: number;
  timeReduction: number;
  riskReduction: number;
  efficiency: number;
  paybackPeriod: number;
}

export const ROICalculatorWidget: React.FC = () => {
  const [inputs, setInputs] = useState<ROIInputs>({
    aiTools: 12,
    partners: 8,
    programValue: 150,
    currentProcessTime: 45
  });

  const [results, setResults] = useState<ROIResults>({
    totalSavings: 0,
    timeReduction: 0,
    riskReduction: 0,
    efficiency: 0,
    paybackPeriod: 0
  });

  const [animateResults, setAnimateResults] = useState(false);

  useEffect(() => {
    // Calculate ROI based on inputs
    const calculateROI = () => {
      const { aiTools, partners, programValue, currentProcessTime } = inputs;
      
      // Base calculations
      const complexityMultiplier = 1 + (aiTools * 0.05) + (partners * 0.1);
      const timeSavingsPercentage = Math.min(75, 30 + (aiTools * 2) + (partners * 1.5));
      const timeReduction = Math.floor(currentProcessTime * (timeSavingsPercentage / 100));
      
      // Financial impact
      const dailyCostOfDelay = (programValue * 1000000) / 365; // Convert millions to dollars per day
      const totalSavings = (dailyCostOfDelay * timeReduction) / 1000000; // Back to millions
      
      // Risk and efficiency
      const riskReduction = Math.min(95, 60 + (aiTools * 2) + (partners * 1.5));
      const efficiency = Math.min(90, 40 + (aiTools * 3) + (partners * 2));
      
      // Payback period (months)
      const implementationCost = 0.5 + (aiTools * 0.02) + (partners * 0.03); // Base cost in millions
      const monthlySavings = totalSavings / 12;
      const paybackPeriod = implementationCost / monthlySavings;

      return {
        totalSavings: Math.round(totalSavings * 10) / 10,
        timeReduction,
        riskReduction: Math.round(riskReduction),
        efficiency: Math.round(efficiency),
        paybackPeriod: Math.round(paybackPeriod * 10) / 10
      };
    };

    const newResults = calculateROI();
    setResults(newResults);
    setAnimateResults(true);
    
    const timer = setTimeout(() => setAnimateResults(false), 1000);
    return () => clearTimeout(timer);
  }, [inputs]);

  const handleInputChange = (field: keyof ROIInputs, value: number[]) => {
    setInputs(prev => ({ ...prev, [field]: value[0] }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  const downloadReport = () => {
    // Generate a simple report
    const report = `
FDA AI Compliance ROI Analysis
Generated: ${new Date().toLocaleDateString()}

INPUTS:
• AI Tools in Development: ${inputs.aiTools}
• External Partners: ${inputs.partners}
• Average Program Value: ${formatCurrency(inputs.programValue)}M
• Current Process Time: ${inputs.currentProcessTime} days

RESULTS:
• Total Annual Savings: ${formatCurrency(results.totalSavings)}M
• Time Reduction: ${results.timeReduction} days (${Math.round((results.timeReduction / inputs.currentProcessTime) * 100)}%)
• Risk Reduction: ${results.riskReduction}%
• Efficiency Gain: ${results.efficiency}%
• Payback Period: ${results.paybackPeriod} months

aicomplyr.io - FDA AI Compliance Platform
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FDA_AI_Compliance_ROI_Analysis_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-primary" />
          <span>FDA AI Compliance ROI Calculator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <h3 className="font-medium text-lg">Your Current Situation</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">AI Tools in Development</label>
                  <Badge variant="outline">{inputs.aiTools}</Badge>
                </div>
                <Slider
                  value={[inputs.aiTools]}
                  onValueChange={(value) => handleInputChange('aiTools', value)}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">External Partners</label>
                  <Badge variant="outline">{inputs.partners}</Badge>
                </div>
                <Slider
                  value={[inputs.partners]}
                  onValueChange={(value) => handleInputChange('partners', value)}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Average Program Value</label>
                  <Badge variant="outline">{formatCurrency(inputs.programValue)}M</Badge>
                </div>
                <Slider
                  value={[inputs.programValue]}
                  onValueChange={(value) => handleInputChange('programValue', value)}
                  max={500}
                  min={10}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Current Approval Time</label>
                  <Badge variant="outline">{inputs.currentProcessTime} days</Badge>
                </div>
                <Slider
                  value={[inputs.currentProcessTime]}
                  onValueChange={(value) => handleInputChange('currentProcessTime', value)}
                  max={120}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <h3 className="font-medium text-lg">Projected Benefits</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                key={results.totalSavings}
                initial={animateResults ? { scale: 0.9, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Annual Savings</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(results.totalSavings)}M
                </div>
              </motion.div>

              <motion.div
                key={results.timeReduction}
                initial={animateResults ? { scale: 0.9, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Time Saved</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {results.timeReduction} days
                </div>
              </motion.div>

              <motion.div
                key={results.riskReduction}
                initial={animateResults ? { scale: 0.9, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Risk Reduction</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {results.riskReduction}%
                </div>
              </motion.div>

              <motion.div
                key={results.efficiency}
                initial={animateResults ? { scale: 0.9, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-purple-50 rounded-lg border border-purple-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Efficiency Gain</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {results.efficiency}%
                </div>
              </motion.div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Payback Period</div>
              <div className="text-xl font-semibold">
                {results.paybackPeriod} months
              </div>
            </div>

            <Button onClick={downloadReport} className="w-full">
              Download ROI Report
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Industry Benchmark:</strong> Companies using aicomplyr.io typically see 60-75% 
            reduction in FDA approval timelines and $2-5M annual savings per major AI program.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};