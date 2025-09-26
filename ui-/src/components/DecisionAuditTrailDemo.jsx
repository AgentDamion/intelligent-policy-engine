import React, { useState } from 'react';
import DecisionAuditTrail from './DecisionAuditTrail';

const DecisionAuditTrailDemo = () => {
  const [selectedOrg, setSelectedOrg] = useState('demo-org-123');

  const organizations = [
    { id: 'demo-org-123', name: 'Demo Organization' },
    { id: 'pharma-enterprise', name: 'Pharmaceutical Enterprise' },
    { id: 'finance-corp', name: 'Financial Corporation' },
    { id: 'healthcare-provider', name: 'Healthcare Provider' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trust & Transparency Audit Trail Demo
          </h1>
          <p className="text-gray-600">
            Comprehensive audit trail component with timeline visualization, filtering, and export capabilities.
          </p>
        </div>

        {/* Organization Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Organization Context
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Component Demo */}
        <DecisionAuditTrail 
          organizationId={selectedOrg}
          className="mb-8"
        />

        {/* Feature Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Component Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Timeline Visualization</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Collapsible timeline entries</li>
                <li>• Visual status indicators</li>
                <li>• Decision type icons</li>
                <li>• Risk level badges</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Advanced Filtering</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Date range filtering</li>
                <li>• User-based filtering</li>
                <li>• Decision type filtering</li>
                <li>• Status and risk level filters</li>
                <li>• Full-text search</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Export Functionality</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PDF export with tables</li>
                <li>• CSV export with all fields</li>
                <li>• Organization-scoped data</li>
                <li>• Timestamped filenames</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Database Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Organization scoping</li>
                <li>• Real-time data fetching</li>
                <li>• Error handling</li>
                <li>• Loading states</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Performance Metrics</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Confidence scores</li>
                <li>• Compliance scores</li>
                <li>• Risk assessments</li>
                <li>• Processing times</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Mobile Responsive</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Responsive grid layouts</li>
                <li>• Touch-friendly interactions</li>
                <li>• Adaptive filtering</li>
                <li>• Mobile-optimized exports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Technical Implementation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">React Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• useState for local state management</li>
                <li>• useEffect for data fetching</li>
                <li>• useMemo for filtered data</li>
                <li>• useCallback for optimized functions</li>
                <li>• Custom hooks for reusability</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Dependencies</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• date-fns for date manipulation</li>
                <li>• lucide-react for icons</li>
                <li>• jspdf for PDF generation</li>
                <li>• jspdf-autotable for tables</li>
                <li>• Tailwind CSS for styling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionAuditTrailDemo; 