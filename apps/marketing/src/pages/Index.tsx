
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import PlatformOverview from '@/components/PlatformOverview';
import LiveComplianceMetrics from '@/components/LiveComplianceMetrics';
import ProofCenterSection from '@/components/ProofCenterSection';
import WhoWeHelpSection from '@/components/WhoWeHelpSection';
import DifferentiatorsSection from '@/components/DifferentiatorsSection';
import FinalCTASection from '@/components/FinalCTASection';
import NewFooter from '@/components/NewFooter';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-brand-warm-white">
      {/* Quick auth link for unauthenticated users */}
      {!user && (
        <div className="fixed top-4 right-4 z-50">
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      )}
      
      <Navigation />
      <HeroSection />
      <PlatformOverview />
      <LiveComplianceMetrics />
      <ProofCenterSection />
      <WhoWeHelpSection />
      <FinalCTASection />
      <NewFooter />
    </div>
  );
};

export default Index;
