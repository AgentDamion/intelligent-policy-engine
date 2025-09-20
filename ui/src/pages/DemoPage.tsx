import React, { useState } from 'react';
import { Card, Button, Badge, Progress } from '@/components/ui';
import { DocumentProcessingPipeline } from '@/components/document-processing/DocumentProcessingPipeline';
import { ApprovalWorkflowDashboard } from '@/components/approval-workflow/ApprovalWorkflowDashboard';
import { ApprovalTimeTracker } from '@/components/approval-workflow/ApprovalTimeTracker';
import { 
  FileText, 
  Clock, 
  Zap, 
  Shield, 
  Activity,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export function DemoPage() {
  const [demoMode, setDemoMode] = useState<'pipeline' | 'workflow' | 'tracking'>('pipeline');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>('demo-submission-1');

  const demoSections = [
    {
      id: 'pipeline',
      title: 'Document Processing Pipeline',
      description: 'Triple-failover parsing with deterministic results',
      icon: FileText,
      features: [
        'Document upload with validation',
        'Triple-failover parsing (AI → Textract → Template)',
        'Real-time processing status',
        'Confidence scoring and results export'
      ]
    },
    {
      id: 'workflow',
      title: 'Approval Workflow Dashboard',
      description: 'Manage approval requests with acceleration metrics',
      icon: Clock,
      features: [
        'Real-time approval queue',
        'Acceleration metrics (47 days → 4 days)',
        'Risk assessment and compliance scoring',
        'Bulk approval actions'
      ]
    },
    {
      id: 'tracking',
      title: 'Time Tracking & Acceleration',
      description: 'Live time tracking with acceleration impact',
      icon: TrendingUp,
      features: [
        'Real-time approval time tracking',
        'Acceleration factor visualization',
        'Time saved calculations',
        'Stage-by-stage progress monitoring'
      ]
    }
  ];

  const handleStartDemo = () => {
    setIsRunning(true);
    // Simulate demo progression
    setTimeout(() => {
      setIsRunning(false);
    }, 10000);
  };

  const handleResetDemo = () => {
    setIsRunning(false);
    setSelectedSubmissionId('demo-submission-1');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              AI Tool Approval Acceleration Platform
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              From 47 days to 4 days • Deterministic infrastructure • Live operational proof
            </p>
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">2,847</div>
                <div className="text-sm text-blue-100">Approvals accelerated this month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">2.3 days</div>
                <div className="text-sm text-blue-100">Median approval time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">99.7%</div>
                <div className="text-sm text-blue-100">Parsing success rate</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={handleStartDemo}
                disabled={isRunning}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Demo Running
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Demo
                  </>
                )}
              </Button>
              <Button
                onClick={handleResetDemo}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Demo Navigation */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Interactive Demo</h2>
            <Badge className="text-green-600 bg-green-50 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              Live Demo Mode
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoSections.map((section) => {
              const Icon = section.icon;
              const isActive = demoMode === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setDemoMode(section.id as any)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 mt-1 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {section.description}
                      </p>
                      <div className="mt-2">
                        <ul className="text-xs text-gray-500 space-y-1">
                          {section.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {isActive && (
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Demo Content */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {demoSections.find(s => s.id === demoMode)?.title}
              </h3>
              <p className="text-gray-600">
                {demoSections.find(s => s.id === demoMode)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {isRunning ? 'Demo Active' : 'Demo Paused'}
              </span>
            </div>
          </div>

          {/* Demo Progress */}
          {isRunning && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Demo Progress</span>
                <span>Running...</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}

          {/* Demo Components */}
          {demoMode === 'pipeline' && (
            <DocumentProcessingPipeline
              onProcessingComplete={(results) => {
                console.log('Demo processing completed:', results);
              }}
            />
          )}

          {demoMode === 'workflow' && (
            <ApprovalWorkflowDashboard
              onRequestSelect={setSelectedSubmissionId}
            />
          )}

          {demoMode === 'tracking' && (
            <ApprovalTimeTracker
              submissionId={selectedSubmissionId || 'demo-submission-1'}
              onTimeUpdate={(metrics) => {
                console.log('Demo time metrics updated:', metrics);
              }}
            />
          )}
        </Card>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Card className="p-6 text-center">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Deterministic Infrastructure</h3>
            <p className="text-sm text-gray-600">
              Same input → Same output → Same audit trail. Every time.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Triple-Failover Parsing</h3>
            <p className="text-sm text-gray-600">
              AI → AWS Textract → Template parsing with guaranteed results.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">47 Days → 4 Days</h3>
            <p className="text-sm text-gray-600">
              Accelerate approvals from weeks to days with AI automation.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Activity className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Live Operational Proof</h3>
            <p className="text-sm text-gray-600">
              Real-time metrics and live governance stream for transparency.
            </p>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="p-8 mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Accelerate Your AI Tool Approvals?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join enterprises and agencies who have reduced approval times from 47 days to 4 days 
              with our deterministic AI compliance platform.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Calculate Your Approval Velocity
              </Button>
              <Button size="lg" variant="outline">
                See Live Governance Lab
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}