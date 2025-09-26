// File: ui/src/components/MetaLoopIconsDemo.jsx

import React, { useState } from 'react';
import MetaLoopIcons from './MetaLoopIcons';

const MetaLoopIconsDemo = () => {
  const [selectedSize, setSelectedSize] = useState(60);

  const iconStates = [
    { key: 'idle', label: 'Idle', description: 'System is monitoring', color: '#6B7280' },
    { key: 'thinking', label: 'Thinking', description: 'Processing request', color: '#3B82F6' },
    { key: 'success', label: 'Success', description: 'Request completed', color: '#87788E' },
    { key: 'alert', label: 'Alert', description: 'Attention required', color: '#CEA889' },
    { key: 'infinity', label: 'MetaLoop', description: 'Brand icon', color: '#3740A5' }
  ];

  const sizes = [
    { value: 40, label: 'Small' },
    { value: 60, label: 'Medium' },
    { value: 80, label: 'Large' },
    { value: 120, label: 'Extra Large' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            MetaLoop SVG Icons Demo
          </h1>
          
          {/* Icon Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {iconStates.map((state) => (
              <div key={state.key} className="text-center">
                <div className="mb-4 flex justify-center">
                  {React.createElement(MetaLoopIcons[state.key], {
                    size: selectedSize,
                    className: 'drop-shadow-lg'
                  })}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{state.label}</h3>
                <p className="text-sm text-gray-600 mb-2">{state.description}</p>
                <div className="flex items-center justify-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: state.color }}
                  ></div>
                  <span className="text-xs text-gray-500">{state.color}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Size Controls */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Icon Sizes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setSelectedSize(size.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedSize === size.value
                      ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="mb-2 flex justify-center">
                      {React.createElement(MetaLoopIcons.idle, {
                        size: size.value * 0.6,
                        className: 'opacity-60'
                      })}
                    </div>
                    <div className="font-medium">{size.label}</div>
                    <div className="text-xs text-gray-500">{size.value}px</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Animation Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Thinking Animation */}
            <div className="bg-gradient-brand rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thinking Animation
              </h3>
              <div className="flex justify-center mb-4">
                {React.createElement(MetaLoopIcons.thinking, {
                  size: 80,
                  className: 'drop-shadow-lg'
                })}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Rotating dotted ring with glow effect
              </p>
            </div>

            {/* Success Animation */}
            <div className="bg-gradient-to-br from-teal-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Success Animation
              </h3>
              <div className="flex justify-center mb-4">
                {React.createElement(MetaLoopIcons.success, {
                  size: 80,
                  className: 'drop-shadow-lg'
                })}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Filled ring with animated checkmark
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Technical Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">SVG Gradients</h4>
                <p className="text-sm text-gray-600">
                  Linear and radial gradients for 3D depth effect
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">CSS Animations</h4>
                <p className="text-sm text-gray-600">
                  Smooth transitions and keyframe animations
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Responsive Design</h4>
                <p className="text-sm text-gray-600">
                  Scalable vector graphics for all screen sizes
                </p>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="mt-8 bg-gradient-brand rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Color Palette
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {iconStates.map((state) => (
                <div key={state.key} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: state.color }}
                  >
                    <span className="text-white font-bold text-lg">
                      {state.key.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{state.label}</div>
                  <div className="text-xs text-gray-500">{state.color}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaLoopIconsDemo; 