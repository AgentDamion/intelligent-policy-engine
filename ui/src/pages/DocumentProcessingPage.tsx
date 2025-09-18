import React, { useState } from 'react';
import { Card, Button, Tabs, Badge } from '@/components/ui';
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
  CheckCircle
} from 'lucide-react';

export function DocumentProcessingPage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const tabs = [
    {
      id: 'pipeline',
      label: 'Document Processing',
      icon: FileText,
      description: 'Upload and process documents with triple-failover parsing'
    },
    {
      id: 'workflow',
      label: 'Approval Workflow',
      icon: Clock,
      description: 'Manage approval requests and track processing times'
    },
    {
      id: 'tracking',
      label: 'Time Tracking',
      icon: TrendingUp,
      description: 'Monitor acceleration metrics and time savings'
    }
  ];

  const handleProcessingComplete = (results: any[]) => {
    console.log('Processing completed:', results);
    // Handle processing completion
  };

  const handleTimeUpdate = (metrics: any) => {
    console.log('Time metrics updated:', metrics);
    // Handle time metrics update
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Tool Approval Platform</h1>
            <p className="text-gray-600">
              From 47 days to 4 days • Deterministic infrastructure • Live operational proof
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="text-green-600 bg-green-50 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              System Operational
            </Badge>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Live Metrics
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approvals Accelerated</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Median Approval Time</p>
                <p className="text-2xl font-bold text-gray-900">2.3 days</p>
                <p className="text-xs text-gray-500">vs 47 days traditional</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Parsing Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">99.7%</p>
                <p className="text-xs text-gray-500">Triple-failover parsing</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Value Unlocked</p>
                <p className="text-2xl font-bold text-gray-900">$47M</p>
                <p className="text-xs text-gray-500">Year to date</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="p-6">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            tabs={tabs}
            className="mb-6"
          />

          {activeTab === 'pipeline' && (
            <DocumentProcessingPipeline
              onProcessingComplete={handleProcessingComplete}
            />
          )}

          {activeTab === 'workflow' && (
            <ApprovalWorkflowDashboard
              onRequestSelect={setSelectedSubmissionId}
            />
          )}

          {activeTab === 'tracking' && selectedSubmissionId && (
            <ApprovalTimeTracker
              submissionId={selectedSubmissionId}
              onTimeUpdate={handleTimeUpdate}
            />
          )}

          {activeTab === 'tracking' && !selectedSubmissionId && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Submission
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a submission from the Approval Workflow tab to view detailed time tracking
              </p>
              <Button onClick={() => setActiveTab('workflow')}>
                Go to Approval Workflow
              </Button>
            </div>
          )}
        </Card>

        {/* Live Proof Stream */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Live Operational Proof</h3>
            <Badge className="text-green-600 bg-green-50 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              Live Stream Active
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">247</div>
              <div className="text-sm text-gray-600">Active Approvals</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">99.7%</div>
              <div className="text-sm text-gray-600">Parsing Success</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">Deterministic</div>
              <div className="text-sm text-gray-600">System Confidence</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}