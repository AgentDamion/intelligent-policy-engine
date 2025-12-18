// File: ui/src/components/MetaLoopIcons.jsx

import React from 'react';

// SVG Icons for MetaLoop Status States
export const MetaLoopIcons = {
  // Idle State - Gray Ring with subtle faceting
  idle: ({ size = 60, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
      <defs>
        <linearGradient id="idleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#9CA3AF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6B7280" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Main Ring */}
      <path
        d="M30 10 A20 20 0 0 1 50 30 A20 20 0 0 1 30 50 A20 20 0 0 1 10 30 A20 20 0 0 1 30 10 Z M30 15 A15 15 0 0 0 15 30 A15 15 0 0 0 30 45 A15 15 0 0 0 45 30 A15 15 0 0 0 30 15 Z"
        fill="url(#idleGradient)"
        stroke="#6B7280"
        strokeWidth="1.5"
      />
      
      {/* Faceted Details */}
      <path d="M30 10 L35 15 L40 20 L45 25 L50 30" stroke="#6B7280" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M50 30 L45 35 L40 40 L35 45 L30 50" stroke="#6B7280" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M30 50 L25 45 L20 40 L15 35 L10 30" stroke="#6B7280" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M10 30 L15 25 L20 20 L25 15 L30 10" stroke="#6B7280" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  ),

  // Thinking State - Blue Dotted Ring with Rotation
  thinking: ({ size = 60, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
      <defs>
        <linearGradient id="thinkingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="thinkingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Glow Effect */}
      <circle cx="30" cy="30" r="25" fill="url(#thinkingGlow)" />
      
      {/* Dotted Ring */}
      <g>
        {/* 8 dots positioned around the ring */}
        <circle cx="30" cy="10" r="2" fill="#3B82F6" />
        <circle cx="42" cy="18" r="2" fill="#3B82F6" />
        <circle cx="50" cy="30" r="2" fill="#3B82F6" />
        <circle cx="42" cy="42" r="2" fill="#3B82F6" />
        <circle cx="30" cy="50" r="2" fill="#3B82F6" />
        <circle cx="18" cy="42" r="2" fill="#3B82F6" />
        <circle cx="10" cy="30" r="2" fill="#3B82F6" />
        <circle cx="18" cy="18" r="2" fill="#3B82F6" />
      </g>
      
      {/* Faceted Ring Outline */}
      <path
        d="M30 10 L35 15 L40 20 L45 25 L50 30 L45 35 L40 40 L35 45 L30 50 L25 45 L20 40 L15 35 L10 30 L15 25 L20 20 L25 15 L30 10"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="1.5"
        opacity="0.8"
      />
    </svg>
  ),

  // Success State - Teal Ring with Checkmark
  success: ({ size = 60, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
      <defs>
        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#87788E" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#87788E" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="successGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#87788E" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#87788E" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Glow Effect */}
      <circle cx="30" cy="30" r="25" fill="url(#successGlow)" />
      
      {/* Main Ring */}
      <circle cx="30" cy="30" r="20" fill="url(#successGradient)" stroke="#87788E" strokeWidth="2" />
      
      {/* Checkmark */}
      <path
        d="M20 30 L25 35 L40 20"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Faceted Details */}
      <path d="M30 10 L35 15 L40 20 L45 25 L50 30" stroke="#87788E" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M50 30 L45 35 L40 40 L35 45 L30 50" stroke="#87788E" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M30 50 L25 45 L20 40 L15 35 L10 30" stroke="#87788E" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M10 30 L15 25 L20 20 L25 15 L30 10" stroke="#87788E" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  ),

  // Alert State - Orange Ring with Exclamation
  alert: ({ size = 60, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
      <defs>
        <linearGradient id="alertGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CEA889" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#CEA889" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="alertGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#CEA889" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#CEA889" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Glow Effect */}
      <circle cx="30" cy="30" r="25" fill="url(#alertGlow)" />
      
      {/* Main Ring */}
      <circle cx="30" cy="30" r="20" fill="url(#alertGradient)" stroke="#CEA889" strokeWidth="2" />
      
      {/* Exclamation Mark */}
      <path
        d="M30 20 L30 35"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="30" cy="40" r="2" fill="#FFFFFF" />
      
      {/* Faceted Details */}
      <path d="M30 10 L35 15 L40 20 L45 25 L50 30" stroke="#CEA889" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M50 30 L45 35 L40 40 L35 45 L30 50" stroke="#CEA889" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M30 50 L25 45 L20 40 L15 35 L10 30" stroke="#CEA889" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M10 30 L15 25 L20 20 L25 15 L30 10" stroke="#CEA889" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  ),

  // Infinity Symbol for MetaLoop Brand
  infinity: ({ size = 60, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
      <defs>
        <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3740A5" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#87788E" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#CEA889" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="infinityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3740A5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3740A5" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Glow Effect */}
      <circle cx="30" cy="30" r="25" fill="url(#infinityGlow)" />
      
      {/* Infinity Symbol */}
      <path
        d="M15 30 A8 8 0 0 1 23 22 A8 8 0 0 1 31 30 A8 8 0 0 1 23 38 A8 8 0 0 1 15 30 Z M29 30 A8 8 0 0 1 37 22 A8 8 0 0 1 45 30 A8 8 0 0 1 37 38 A8 8 0 0 1 29 30 Z"
        fill="url(#infinityGradient)"
        stroke="#3740A5"
        strokeWidth="1.5"
      />
      
      {/* Central Light Source */}
      <circle cx="30" cy="30" r="3" fill="#FFFFFF" opacity="0.8">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
      
      {/* Faceted Details */}
      <path d="M15 30 L20 25 L25 20 L30 15" stroke="#3740A5" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M45 30 L40 25 L35 20 L30 15" stroke="#3740A5" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M15 30 L20 35 L25 40 L30 45" stroke="#3740A5" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M45 30 L40 35 L35 40 L30 45" stroke="#3740A5" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  )
};

export default MetaLoopIcons; 