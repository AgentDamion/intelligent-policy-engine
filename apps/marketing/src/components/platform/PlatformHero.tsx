
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight } from 'lucide-react';

const PlatformHero = () => {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Background geometric shapes */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            The Compliance Platform for{' '}
            <span className="text-teal">Responsible AI Innovation</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Agentic AI copilots, human oversight, and seamless compliance—all in one beautiful dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-teal hover:bg-teal/90 text-white px-8 py-3 text-lg hover-scale group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-teal text-teal hover:bg-teal hover:text-white px-8 py-3 text-lg hover-scale group"
            >
              <Play className="mr-2 h-5 w-5" />
              Book a Demo
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="geometric-shape bg-gradient-to-br from-teal/5 to-orange/5 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="ml-4 text-sm text-gray-600">aicomplyr.io Platform Dashboard</div>
                </div>
                <div className="p-8">
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">2,847</div>
                      <div className="text-sm text-gray-600">Automated Checks</div>
                      <div className="text-xs text-green-600 mt-1">+12% this week</div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">99.4%</div>
                      <div className="text-sm text-gray-600">Accuracy Rate</div>
                      <div className="text-xs text-blue-600 mt-1">Industry leading</div>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                      <div className="text-sm text-gray-600">AI Monitoring</div>
                      <div className="text-xs text-orange-600 mt-1">Always active</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 bg-white rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">AI Risk Assessment Complete</div>
                          <div className="text-sm text-gray-600">Healthcare AI model - Low risk detected</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Approved</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 bg-white rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Human Review Required</div>
                          <div className="text-sm text-gray-600">Financial AI copilot - Manual review flagged</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-yellow-600">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformHero;
