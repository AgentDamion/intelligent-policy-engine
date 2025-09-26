// File: ui/src/components/MetaLoopStatusRingDemo.jsx

import React, { useState } from 'react';
import MetaLoopStatusRing from './MetaLoopStatusRing';

const MetaLoopStatusRingDemo = () => {
  const [currentStatus, setCurrentStatus] = useState('idle');
  const [selectedSize, setSelectedSize] = useState('medium');
  const [useSvgIcons, setUseSvgIcons] = useState(true);

  const statuses = [
    { key: 'idle', label: 'Idle', description: 'System is monitoring' },
    { key: 'thinking', label: 'Thinking', description: 'Processing request' },
    { key: 'success', label: 'Success', description: 'Request completed' },
    { key: 'alert', label: 'Alert', description: 'Attention required' }
  ];

  const sizes = [
    { key: 'small', label: 'Small', size: 40 },
    { key: 'medium', label: 'Medium', size: 60 },
    { key: 'large', label: 'Large', size: 80 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            MetaLoop Status Ring Demo
          </h1>
          
          {/* Status Ring Display */}
          <div className="flex justify-center items-center mb-12">
            <div className="text-center">
              <div className="mb-4">
                <MetaLoopStatusRing
                  size={selectedSize}
                  showTooltip={true}
                  onStatusChange={setCurrentStatus}
                  useSvgIcons={useSvgIcons}
                />
              </div>
              <div className="text-lg font-semibold text-gray-700">
                Current Status: {currentStatus}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Status Controls */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status States
              </h3>
              <div className="space-y-3">
                {statuses.map((status) => (
                  <button
                    key={status.key}
                    onClick={() => setCurrentStatus(status.key)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                      currentStatus === status.key
                        ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium">{status.label}</div>
                        <div className="text-sm text-gray-500">{status.description}</div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Controls */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Size Options
              </h3>
              <div className="space-y-3">
                {sizes.map((size) => (
                  <button
                    key={size.key}
                    onClick={() => setSelectedSize(size.key)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedSize === size.key
                        ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium">{size.label}</div>
                        <div className="text-sm text-gray-500">{size.size}px diameter</div>
                      </div>
                      <div 
                        className="rounded-full border-2 border-gray-300"
                        style={{ width: size.size * 0.4, height: size.size * 0.4 }}
                      ></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Type Controls */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Icon Type
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setUseSvgIcons(true)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                      useSvgIcons
                        ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-medium">SVG Icons</div>
                      <div className="text-sm text-gray-500">3D Low-poly style</div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-300"></div>
                  </div>
                </button>
                <button
                  onClick={() => setUseSvgIcons(false)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                      !useSvgIcons
                        ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-medium">Canvas Icons</div>
                      <div className="text-sm text-gray-500">Animated rings</div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="mt-8 bg-gradient-brand rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statuses.map((status) => (
                <div key={status.key} className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className={`w-4 h-4 rounded-full ${
                        status.key === 'idle' ? 'bg-gray-400' :
                        status.key === 'thinking' ? 'bg-brand-indigo' :
                        status.key === 'success' ? 'bg-teal-500' :
                        'bg-orange-500'
                      }`}
                    ></div>
                    <span className="font-medium text-gray-900">{status.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{status.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Color Palette
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-400 mx-auto mb-2"></div>
                <div className="text-sm font-medium text-gray-900">Idle</div>
                <div className="text-xs text-gray-500">#6B7280</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-indigo mx-auto mb-2"></div>
                <div className="text-sm font-medium text-gray-900">Thinking</div>
                <div className="text-xs text-gray-500">#4B4BFF</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: '#87788E' }}></div>
                <div className="text-sm font-medium text-gray-900">Success</div>
                <div className="text-xs text-gray-500">#87788E</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: '#CEA889' }}></div>
                <div className="text-sm font-medium text-gray-900">Alert</div>
                <div className="text-xs text-gray-500">#CEA889</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaLoopStatusRingDemo; 