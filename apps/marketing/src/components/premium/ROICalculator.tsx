import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, TrendingUp, Clock, DollarSign, Info, Download } from 'lucide-react';

const ROICalculator = () => {
  const [inputs, setInputs] = useState({
    hours: 2000,
    rate: 150,
    tools: 25
  });
  
  const [totalSavings, setTotalSavings] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Calculate ROI: (hours * rate * 0.6) + (tools * 5000)
    const timeSavings = inputs.hours * inputs.rate * 0.6; // 60% time savings
    const toolEfficiency = inputs.tools * 5000; // $5k per tool in efficiency gains
    const total = timeSavings + toolEfficiency;
    
    setTotalSavings(total);
  }, [inputs]);

  useEffect(() => {
    // Animate the total savings number
    const duration = 1000;
    const steps = 50;
    const stepDuration = duration / steps;
    const increment = totalSavings / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setAnimatedValue(Math.round(increment * currentStep));
        currentStep++;
      } else {
        setAnimatedValue(totalSavings);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [totalSavings]);

  const handleInputChange = (field: string, value: number) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="py-32 bg-brand-warm-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-black text-brand-dark mb-6 tracking-tight">
            Calculate Your Compliance ROI
          </h2>
          <p className="text-xl text-brand-dark/60 max-w-3xl mx-auto font-light">
            See how much your enterprise could save with automated AI governance
          </p>
        </motion.div>

        {/* Two column hero block with generous whitespace */}
        <div className="bg-brand-taupe rounded-3xl p-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Calculator Inputs - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-brand-dark mb-8">Your Current Situation</h3>
              
              <div className="space-y-8">
                {/* Hours per year */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-brand-dark/70">
                      Annual Compliance Hours
                    </label>
                    <span className="text-xl font-bold text-brand-dark">{inputs.hours.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="100"
                    value={inputs.hours}
                    onChange={(e) => handleInputChange('hours', parseInt(e.target.value))}
                    className="w-full h-3 bg-brand-taupe rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-brand-dark/50 mt-2">
                    <span>500 hours</span>
                    <span>10,000 hours</span>
                  </div>
                </div>

                {/* Hourly rate */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-brand-dark/70">
                      Average Hourly Cost
                    </label>
                    <span className="text-xl font-bold text-brand-dark">${inputs.rate}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={inputs.rate}
                    onChange={(e) => handleInputChange('rate', parseInt(e.target.value))}
                    className="w-full h-3 bg-brand-taupe rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-brand-dark/50 mt-2">
                    <span>$50/hour</span>
                    <span>$500/hour</span>
                  </div>
                </div>

                {/* Number of tools */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-brand-dark/70">
                      Number of AI Tools
                    </label>
                    <span className="text-xl font-bold text-brand-dark">{inputs.tools}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={inputs.tools}
                    onChange={(e) => handleInputChange('tools', parseInt(e.target.value))}
                    className="w-full h-3 bg-brand-taupe rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-brand-dark/50 mt-2">
                    <span>5 tools</span>
                    <span>100 tools</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results - Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Large teal savings number */}
            <div className="mb-8">
              <div className="text-sm font-semibold text-brand-dark/60 mb-4 uppercase tracking-wide">
                Estimated Annual Savings
              </div>
              <div className="text-6xl md:text-7xl font-black text-brand-teal mb-4">
                {formatCurrency(animatedValue)}
              </div>
              <p className="text-lg text-brand-dark/60">
                Based on 70% efficiency gain
              </p>
            </div>

            {/* Savings breakdown - minimal */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark/70">Time Savings (60% efficiency)</span>
                  <span className="font-bold text-brand-dark">
                    {formatCurrency(inputs.hours * inputs.rate * 0.6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark/70">Tool Optimization</span>
                  <span className="font-bold text-brand-dark">
                    {formatCurrency(inputs.tools * 5000)}
                  </span>
                </div>
                <div className="border-t border-brand-taupe-dark/30 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-dark">Total Annual Savings</span>
                    <span className="font-black text-brand-teal text-xl">
                      {formatCurrency(totalSavings)}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-8 bg-brand-teal text-white py-4 px-6 rounded-xl font-bold hover:bg-brand-teal/90 transition-colors text-lg">
                Get Detailed ROI Report
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, hsl(180, 70%, 45%), hsl(188, 70%, 45%));
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 2px solid white;
            transition: all 0.2s ease;
          }
          
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }
          
          .slider::-moz-range-thumb {
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, hsl(180, 70%, 45%), hsl(188, 70%, 45%));
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .slider::-webkit-slider-track {
            height: 12px;
            border-radius: 6px;
            background: linear-gradient(90deg, hsl(180, 70%, 45%) 0%, hsl(188, 70%, 45%) 100%);
          }
        `
      }} />
    </section>
  );
};

export default ROICalculator;