import React, { useState } from 'react';
import { ToastProvider } from '@/components/ui';
import { DemoPage } from './pages/DemoPage';
import { DocumentProcessingPage } from './pages/DocumentProcessingPage';
import { ComprehensiveDashboard } from './pages/ComprehensiveDashboard';
import { Button, Card, Badge } from '@/components/ui';
import { 
  FileText, 
  Clock, 
  Zap, 
  Activity,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  Download
} from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<'demo' | 'platform' | 'comprehensive'>('demo');

  const pages = [
    {
      id: 'demo',
      title: 'Interactive Demo',
      description: 'Experience the platform with live demonstrations',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'platform',
      title: 'Document Processing Platform',
      description: 'Full document processing and approval workflow',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Dashboard',
      description: 'Complete platform with all features integrated',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AIComply.io</h1>
                <p className="text-sm text-gray-600">
                  Deterministic AI compliance platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="text-green-600 bg-green-50 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Live Demo
              </Badge>
              <Button
                variant={currentPage === 'demo' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('demo')}
              >
                Interactive Demo
              </Button>
              <Button
                variant={currentPage === 'platform' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('platform')}
              >
                Document Processing
              </Button>
              <Button
                variant={currentPage === 'comprehensive' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('comprehensive')}
              >
                Full Dashboard
              </Button>
            </div>
          </div>
        </nav>

        {/* Page Selection */}
        <div className="p-6">
          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Experience
              </h2>
              <p className="text-gray-600">
                Explore different aspects of the AIComply.io platform
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pages.map((page) => {
                const Icon = page.icon;
                const isActive = currentPage === page.id;
                
                return (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPage(page.id as any)}
                    className={`p-6 rounded-lg border text-left transition-all ${
                      isActive
                        ? `${page.borderColor} ${page.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className={`h-8 w-8 mt-1 ${page.color}`} />
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${
                          isActive ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                          {page.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {page.description}
                        </p>
                        {isActive && (
                          <div className="flex items-center mt-3 text-sm text-blue-600">
                            <span>Currently Active</span>
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Main Content */}
          {currentPage === 'demo' && <DemoPage />}
          {currentPage === 'platform' && <DocumentProcessingPage />}
          {currentPage === 'comprehensive' && <ComprehensiveDashboard />}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-8 mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Platform</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Document Processing</li>
                  <li>Approval Workflow</li>
                  <li>Time Tracking</li>
                  <li>Live Metrics</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Triple-Failover Parsing</li>
                  <li>Deterministic Infrastructure</li>
                  <li>47 Days → 4 Days</li>
                  <li>Live Operational Proof</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Compliance</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>FDA 21 CFR Part 11</li>
                  <li>HIPAA Compliance</li>
                  <li>GDPR Alignment</li>
                  <li>SOC 2 Ready</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Calculate Approval Velocity</li>
                  <li>See Live Governance Lab</li>
                  <li>Book Technical Deep Dive</li>
                  <li>Contact Sales</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-8 pt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  © 2024 AIComply.io. All rights reserved.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>Security</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;