import React from 'react';

export function AnimatedBackground() {
  return (
    <>
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#132035] to-[#1A2740] animate-gradient-drift" />
      
      {/* Animated radial gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-brand-teal/10 via-transparent to-transparent blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl animate-float-delayed" />
      </div>
      
      {/* Subtle geometric grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(90deg, rgba(20, 184, 166, 0.3) 1px, transparent 1px),
                         linear-gradient(0deg, rgba(20, 184, 166, 0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
    </>
  );
}
