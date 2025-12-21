import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, FileCheck, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VERAOrb } from '@/components/vera/VERAOrb';

const capabilities = [
  {
    icon: Shield,
    title: 'Autonomous policy enforcement',
    description: 'Real-time evaluation of every AI tool request against your policies'
  },
  {
    icon: Brain,
    title: 'Real-time decision architecture',
    description: 'Millisecond responses with full reasoning transparency'
  },
  {
    icon: FileCheck,
    title: 'Proof Bundle generation',
    description: 'Cryptographic audit trail for every approved run'
  },
  {
    icon: Eye,
    title: 'Start in Shadow Mode',
    description: 'Observe before enforce — validate policies with zero risk'
  }
];

export const MeetVERASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1a1a2e] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: VERA Orb */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold tracking-wider uppercase mb-6 text-white/60">
              Introducing
            </p>
            <div className="relative w-64 h-64 mb-6">
              <VERAOrb size="lg" showLabels={false} />
            </div>
            <h2 className="text-3xl font-bold mb-2 font-solution">MEET VERA</h2>
            <p className="text-sm text-white/70">Your AI Governance Officer</p>
            <p className="text-center text-sm text-white/60 mt-4 max-w-sm">
              VERA operates at the boundary between your enterprise and external partners. 
              She governs AI tool usage in real-time, enforces policy compliance, and generates 
              proof bundles automatically.
            </p>
            <Button asChild className="mt-6 bg-primary hover:bg-primary/90 rounded-full">
              <Link to="/vera">
                Meet VERA <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Right: Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{capability.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetVERASection;



