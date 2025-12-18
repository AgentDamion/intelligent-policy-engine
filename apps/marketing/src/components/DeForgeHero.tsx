import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const DeForgeHero = () => {
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const terminalSequence = [
    "> generate patient ad with Midjourney",
    "❌ BLOCKED: Requires MLR approval",
    "✅ Suggestion: Use stock image library",
    "",
    "🧾 Logged: 10:42 AM",
    "📍 Workspace: Pfizer-Ogilvy", 
    "🔐 Policy: V3.1 / Patient-Facing Rules"
  ];

  const metrics = [
    { label: 'AI Tool Uses This Week', value: '847', status: '' },
    { label: 'Compliant Interactions', value: '97.2%', status: '✅' },
    { label: 'Policy Violations (Blocked)', value: '24', status: '⚠️' },
    { label: 'Human Reviews Escalated', value: '12', status: '🧑‍⚖️' },
    { label: 'Unlogged Events', value: '0', status: '(Meta-Loop Verified ✅)' }
  ];

  // Terminal typing animation
  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let currentText = '';
    
    const typeNextChar = () => {
      if (lineIndex < terminalSequence.length) {
        const currentLine = terminalSequence[lineIndex];
        if (charIndex < currentLine.length) {
          currentText += currentLine[charIndex];
          setTypedText(currentText);
          charIndex++;
          setTimeout(typeNextChar, 50);
        } else {
          currentText += '\n';
          setTypedText(currentText);
          lineIndex++;
          charIndex = 0;
          setTimeout(typeNextChar, 200);
        }
      }
    };
    
    const timer = setTimeout(typeNextChar, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Cursor blink
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <section className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1b3a 50%, #2d1b69 100%)' 
    }}>
      {/* Background Meta-Loop Animation */}
      <div className="absolute top-20 right-20 w-24 h-24 opacity-5">
        <div className="w-full h-full border border-cyan-400 rounded-full animate-spin" style={{ animation: 'meta-loop-pulse 8s ease-in-out infinite' }}>
          <div className="absolute top-1 left-1 w-20 h-20 border border-cyan-400 rounded-full"></div>
          <div className="absolute top-2 left-2 w-16 h-16 border border-cyan-400 rounded-full"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
        
        {/* Headline + Copy Block (Above both columns) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left mb-16 max-w-4xl"
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Prove AI Compliance —{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              in Real Time.
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-4 leading-relaxed">
            aicomplyr.io enforces enterprise AI tool policies at the point of use.
          </p>
          <p className="text-lg text-gray-400">
            Every prompt. Every tool. Every action logged.
          </p>
        </motion.div>

        {/* 4-Step Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
            {/* Step 1: Policy */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-600"></div>
              </div>
              <h3 className="text-white font-semibold mb-2">Policy</h3>
              <p className="text-gray-400 text-sm">Enterprises define tool rules per workspace</p>
            </div>
            
            {/* Connector Line */}
            <div className="hidden lg:block w-12 h-px bg-slate-600"></div>
            
            {/* Step 2: Secure Invites */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 flex items-center justify-center border-2 border-cyan-400">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">Secure Invites</h3>
              <p className="text-gray-400 text-sm">Securely invite agencies into governed workspaces</p>
            </div>
            
            {/* Connector Line */}
            <div className="hidden lg:block w-12 h-px bg-slate-600"></div>
            
            {/* Step 3: Monitor */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-600"></div>
              </div>
              <h3 className="text-white font-semibold mb-2">Monitor</h3>
              <p className="text-gray-400 text-sm">Live decision engine blocks or escalates usage</p>
            </div>
            
            {/* Connector Line */}
            <div className="hidden lg:block w-12 h-px bg-slate-600"></div>
            
            {/* Step 4: Prove */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-600"></div>
              </div>
              <h3 className="text-white font-semibold mb-2">Prove</h3>
              <p className="text-gray-400 text-sm">One-click regulator-ready compliance packages</p>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* Left Column - 60% Width - Terminal */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden shadow-2xl">
              {/* Terminal Header */}
              <div className="flex items-center justify-between bg-slate-800/80 px-4 py-3 border-b border-slate-700/50">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm font-mono">AI Compliance Terminal</div>
                <div className="w-16"></div>
              </div>
              
              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm min-h-[300px]">
                <div className="text-green-400">
                  <pre className="whitespace-pre-wrap leading-relaxed">
{typedText}{showCursor && <span className="text-cyan-400 animate-pulse">|</span>}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - 40% Width - Metrics + CTAs */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 space-y-8"
          >
            
            {/* Metrics Dashboard */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg border border-slate-700/40 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Live Metrics</h3>
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{metric.value}</span>
                        {metric.status && <span className="text-sm">{metric.status}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-black px-6 py-4 text-base font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Run a Live Policy Simulation
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full border-2 border-slate-600 text-gray-300 hover:text-white hover:border-cyan-400 bg-transparent px-6 py-4 text-base font-semibold rounded-lg transition-all duration-300"
              >
                <FileText className="mr-2 h-5 w-5" />
                View Sample Compliance Audit
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-10 w-16 h-16 border border-purple-400/20 rounded-full animate-pulse"></div>
      <div className="absolute top-40 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute top-60 right-40 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
    </section>
  );
};

export default DeForgeHero;