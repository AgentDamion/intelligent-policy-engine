// File: ui/components/MetaLoopStatusDemo.jsx

import React, { useState } from 'react';
import { MetaLoopStatus } from './MetaLoopStatus';

const MetaLoopStatusDemo = () => {
  const [currentStatus, setCurrentStatus] = useState('idle');
  const [position, setPosition] = useState('top-right');
  const [size, setSize] = useState('medium');

  const statusOptions = [
    { value: 'idle', label: 'Idle', description: 'Monitoring compliance' },
    { value: 'processing', label: 'Processing', description: 'Analyzing policy requests' },
    { value: 'active', label: 'Active', description: 'Making governance decisions' },
    { value: 'alert', label: 'Alert', description: 'Requiring human attention' }
  ];

  const positionOptions = [
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'inline', label: 'Inline' }
  ];

  const sizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    console.log('Status changed to:', status);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">🐦</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">MetaLoopStatus Demo</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Animated AI Status</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Status Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Status Control</h2>
              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCurrentStatus(option.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                      currentStatus === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: {
                            idle: '#10b981',
                            processing: '#f59e0b',
                            active: '#3b82f6',
                            alert: '#ef4444'
                          }[option.value]
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Position Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Position</h2>
              <div className="grid grid-cols-2 gap-2">
                {positionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPosition(option.value)}
                    className={`p-2 rounded text-sm font-medium transition-colors duration-200 ${
                      position === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Size</h2>
              <div className="space-y-2">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSize(option.value)}
                    className={`w-full p-2 rounded text-sm font-medium transition-colors duration-200 ${
                      size === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Demo Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interactive Demo</h2>
              <div className="relative h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Click the MetaLoopStatus component to see the detailed panel</p>
                  <p className="text-sm text-gray-500">Current Status: <span className="font-medium capitalize">{currentStatus}</span></p>
                </div>

                {/* Inline Demo */}
                {position === 'inline' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <MetaLoopStatus 
                      position="inline"
                      size={size}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">4 distinct AI states with unique animations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Smooth polygonal ring visualizations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Real-time status updates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Click to expand for detailed activity</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Non-intrusive overlay design</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Multiple position options</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Responsive sizing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Integration with existing UI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MetaLoopStatus Components */}
      {position !== 'inline' && (
        <>
          <MetaLoopStatus 
            position={position}
            size={size}
            onStatusChange={handleStatusChange}
          />
          
          {/* Additional positions for demo */}
          {position === 'top-right' && (
            <>
              <MetaLoopStatus 
                position="top-left"
                size="small"
                onStatusChange={() => {}}
              />
              <MetaLoopStatus 
                position="bottom-right"
                size="large"
                onStatusChange={() => {}}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MetaLoopStatusDemo; 