import React, { useState } from 'react';
import { DemoPage } from './pages/DemoPage';
import { DocumentProcessingPage } from './pages/DocumentProcessingPage';
import { Button, Card, Badge } from './components/ui';
import { 
  FileText, 
  Clock, 
  Zap, 
  Activity,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<'demo' | 'full'>('demo');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AIComply.io</h1>
            <Badge className="text-green-600 bg-green-50 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Live Demo
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant={currentPage === 'demo' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('demo')}
            >
              Interactive Demo
            </Button>
            <Button
              variant={currentPage === 'full' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('full')}
            >
              Full Platform
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentPage === 'demo' && <DemoPage />}
      {currentPage === 'full' && <DocumentProcessingPage />}

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
  );
}

export default App;