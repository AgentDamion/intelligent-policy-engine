import React, { useState } from 'react';
import MetricsHeader from './MetricsHeader';

const MetricsHeaderDemo = () => {
  const [demoMode, setDemoMode] = useState('default');

  const handleDemoModeChange = (mode) => {
    setDemoMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            MetricsHeader Component Demo
          </h1>
          <p className="text-gray-600">
            Clean metrics display with enterprise design and analytics integration
          </p>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demo Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDemoModeChange('default')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'default'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => handleDemoModeChange('compact')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'compact'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Compact
                </button>
                <button
                  onClick={() => handleDemoModeChange('full-width')}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    demoMode === 'full-width'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Full Width
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MetricsHeader Component */}
      <div className={demoMode === 'full-width' ? '' : 'max-w-7xl mx-auto px-6'}>
        <MetricsHeader 
          className={demoMode === 'compact' ? 'compact-mode' : ''}
        />
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Main Application Content
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">📊 Dashboard Overview</h3>
              <p className="text-blue-700 text-sm">
                This is the main application area where users would normally see their dashboard, 
                analytics, or other content. The MetricsHeader appears above this content area 
                to provide key performance indicators at a glance.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">🎯 Key Features</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Three key stats: "3.2M Audit tasks Historical", "87% Faster decisions", "24/7 Real Time Transparency"</li>
                <li>• Clean card layout with proper spacing and enterprise design</li>
                <li>• Integration with existing analytics data from dashboard API</li>
                <li>• Responsive design that adapts to different screen sizes</li>
                <li>• Loading states and error handling</li>
                <li>• Dark mode and accessibility support</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-900 mb-2">🔧 Technical Details</h3>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Fetches live metrics from <code>/api/dashboard/live-metrics</code></li>
                <li>• Uses Inter font family with proper weight hierarchy</li>
                <li>• CSS Grid layout with responsive breakpoints</li>
                <li>• Hover effects and smooth transitions</li>
                <li>• Skeleton loading animation for better UX</li>
                <li>• WCAG AA compliant color contrast</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-900 mb-2">💡 Usage Examples</h3>
              <div className="text-yellow-700 text-sm space-y-2">
                <div>
                  <strong>Basic Usage:</strong>
                  <pre className="bg-yellow-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`<MetricsHeader />`}
                  </pre>
                </div>
                <div>
                  <strong>With Custom Class:</strong>
                  <pre className="bg-yellow-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`<MetricsHeader className="custom-metrics" />`}
                  </pre>
                </div>
                <div>
                  <strong>Integration with Dashboard:</strong>
                  <pre className="bg-yellow-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`<div className="dashboard">
  <MetricsHeader />
  <DashboardContent />
</div>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Integration Examples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Enterprise Dashboard</h3>
              <p className="text-gray-600 text-sm mb-3">
                Perfect for enterprise dashboards where you need to show key performance indicators prominently.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Use Case:</strong> Executive overview, compliance reporting, audit summaries
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Agency Portal</h3>
              <p className="text-gray-600 text-sm mb-3">
                Ideal for agency portals where you need to demonstrate value and efficiency to clients.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Use Case:</strong> Client reporting, performance metrics, service delivery
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Compliance Center</h3>
              <p className="text-gray-600 text-sm mb-3">
                Essential for compliance centers where transparency and audit trails are critical.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Use Case:</strong> Regulatory reporting, audit trails, compliance monitoring
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Analytics Hub</h3>
              <p className="text-gray-600 text-sm mb-3">
                Perfect for analytics hubs where you need to surface key insights quickly.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Use Case:</strong> Data insights, performance analytics, trend analysis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsHeaderDemo; 