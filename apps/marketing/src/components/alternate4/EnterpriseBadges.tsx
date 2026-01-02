import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, FileCheck, Lock } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    title: 'SOC 2 Type II Roadmap',
    description: 'Enterprise-grade security by Q2 2025',
    status: 'In Progress'
  },
  {
    icon: CheckCircle,
    title: 'EU AI Act Ready',
    description: 'Compliant with emerging EU requirements',
    status: 'Ready'
  },
  {
    icon: FileCheck,
    title: 'FDA 21 CFR Part 11 Compatible',
    description: 'Electronic records and signatures support',
    status: 'Compatible'
  },
  {
    icon: Lock,
    title: 'US HITRUST Hosting',
    description: 'Data residency in certified infrastructure',
    status: 'Available'
  }
];

export const EnterpriseBadges = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase text-center mb-8">
          Built for Enterprise
        </p>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Enterprise-grade governance you can trust from day one
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div 
                key={index}
                className="flex flex-col items-center text-center p-4"
              >
                <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {badge.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/about"
            className="text-sm text-primary hover:text-primary/80 hover:underline"
          >
            Learn about our security →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseBadges;














