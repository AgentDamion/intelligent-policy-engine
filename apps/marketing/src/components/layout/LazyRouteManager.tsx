import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import NotFound from '@/pages/NotFound';
import { shouldRedirectToPlatform, redirectToPlatformIfNeeded } from '@/utils/platformRedirect';
import { PlatformRedirect } from '@/components/route/PlatformRedirect';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { VendorLayout } from '@/components/layout/VendorLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy load marketing page components
const Index = lazy(() => import('@/pages/Index'));
const Platform = lazy(() => import('@/pages/Platform'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const ProofCenter = lazy(() => import('@/pages/ProofCenter'));
const AIAccelerationScore = lazy(() => import('@/pages/AIAccelerationScore'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Contact = lazy(() => import('@/pages/Contact'));
const About = lazy(() => import('@/pages/About'));
const PharmaceuticalIndustry = lazy(() => import('@/pages/PharmaceuticalIndustry'));
const MarketingServices = lazy(() => import('@/pages/MarketingServices'));
const BookDemo = lazy(() => import('@/pages/BookDemo'));
const FoundingPartners = lazy(() => import('@/pages/FoundingPartners'));
const Premium = lazy(() => import('@/pages/Premium'));
const AlternateLanding = lazy(() => import('@/pages/AlternateLanding'));
const Alternate2Landing = lazy(() => import('@/pages/Alternate2Landing'));
const Alternate3 = lazy(() => import('@/pages/Alternate3'));
const Alternate4 = lazy(() => import('@/pages/Alternate4'));
const HowItWorks = lazy(() => import('@/pages/HowItWorks'));
const WhoItsFor = lazy(() => import('@/pages/WhoItsFor'));
const BoundaryLab = lazy(() => import('@/pages/BoundaryLab'));

// New Marketing Pages
const VERAConversation = lazy(() => import('@/pages/VERAConversation'));
const WorkflowLibrary = lazy(() => import('@/pages/WorkflowLibrary'));
const MissionControlDemo = lazy(() => import('@/pages/MissionControlDemo'));

// Legal Document Pages
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const DataProcessing = lazy(() => import('@/pages/DataProcessing'));

// Public Website Pages
const Industries = lazy(() => import('@/pages/public/Resources')); 
const Resources = lazy(() => import('@/pages/public/Resources'));
const Investors = lazy(() => import('@/pages/Investors'));
const WhitePapers = lazy(() => import('@/pages/WhitePapers'));
const VelocityCalculator = lazy(() => import('@/pages/public/VelocityCalculator'));

// Loading component for route transitions
interface RouteLoadingSpinnerProps {
  routeName?: string;
}

const RouteLoadingSpinner: React.FC<RouteLoadingSpinnerProps> = ({ routeName }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        {routeName && (
          <p className="text-muted-foreground">Loading {routeName}...</p>
        )}
      </div>
    </div>
  );
};

// Layout Wrappers
interface RouteWrapperProps {
  children: React.ReactNode;
  routeName?: string;
}

const PublicRouteWrapper: React.FC<RouteWrapperProps> = ({ children, routeName }) => {
  return (
    <Suspense fallback={<RouteLoadingSpinner routeName={routeName} />}>
      {children}
    </Suspense>
  );
};

export const LazyRouteManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check for platform-only routes and redirect in production
  useEffect(() => {
    if (shouldRedirectToPlatform(location.pathname)) {
      setIsRedirecting(true);
      redirectToPlatformIfNeeded(location.pathname);
    } else {
      setIsRedirecting(false);
    }
  }, [location.pathname]);

  // Listen for profile type changes and handle navigation
  useEffect(() => {
    const handleProfileChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ newType: string }>;
      const newType = customEvent.detail.newType;
      
      console.log('🔀 LazyRouteManager: Profile type changed to', newType);
      
      if (newType === 'enterprise') {
        navigate('/enterprise/dashboard', { replace: true });
      } else if (newType === 'partner') {
        navigate('/agency/dashboard', { replace: true });
      } else if (newType === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      }
    };
    
    window.addEventListener('profile-type-changed', handleProfileChange);
    return () => window.removeEventListener('profile-type-changed', handleProfileChange);
  }, [navigate]);

  // Debug navigation type
  useEffect(() => {
    if (import.meta.env.DEV) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      console.group('🚀 Navigation Event');
      console.log('Path:', location.pathname);
      console.log('Type:', navEntry?.type || 'unknown');
      console.log('Is SPA navigation:', navEntry?.type === 'navigate');
      console.groupEnd();
    }
  }, [location.pathname]);

  // Show redirect screen for platform-only routes (in production, redirectToPlatformIfNeeded handles the actual redirect)
  if (isRedirecting && import.meta.env.PROD) {
    return <PlatformRedirect />;
  }

  return (
    <Routes>
      {/* Public Marketing Routes */}
      <Route path="/" element={
        <PublicRouteWrapper routeName="Home">
          <Alternate4 />
        </PublicRouteWrapper>
      } />
      <Route path="/platform" element={
        <PublicRouteWrapper routeName="Platform">
          <Platform />
        </PublicRouteWrapper>
      } />
      <Route path="/marketplace-public" element={
        <PublicRouteWrapper routeName="Marketplace">
          <Marketplace />
        </PublicRouteWrapper>
      } />
      <Route path="/proof-center" element={
        <PublicRouteWrapper routeName="Proof Center">
          <ProofCenter />
        </PublicRouteWrapper>
      } />
      <Route path="/pricing" element={
        <PublicRouteWrapper routeName="Pricing">
          <Pricing />
        </PublicRouteWrapper>
      } />
      <Route path="/contact" element={
        <PublicRouteWrapper routeName="Contact">
          <Contact />
        </PublicRouteWrapper>
      } />
      <Route path="/about" element={
        <PublicRouteWrapper routeName="About">
          <About />
        </PublicRouteWrapper>
      } />
      <Route path="/industries/pharmaceutical" element={
        <PublicRouteWrapper routeName="Pharmaceutical Industry">
          <PharmaceuticalIndustry />
        </PublicRouteWrapper>
      } />
      <Route path="/industries/marketing-services" element={
        <PublicRouteWrapper routeName="Marketing Services">
          <MarketingServices />
        </PublicRouteWrapper>
      } />
      <Route path="/book-demo" element={
        <PublicRouteWrapper routeName="Book Demo">
          <BookDemo />
        </PublicRouteWrapper>
      } />
      <Route path="/founding-partners" element={
        <PublicRouteWrapper routeName="Founding Partners">
          <FoundingPartners />
        </PublicRouteWrapper>
      } />
      <Route path="/premium" element={
        <PublicRouteWrapper routeName="Premium">
          <Premium />
        </PublicRouteWrapper>
      } />
      <Route path="/legacy" element={
        <PublicRouteWrapper routeName="Legacy">
          <Index />
        </PublicRouteWrapper>
      } />
      <Route path="/alternate" element={
        <PublicRouteWrapper routeName="Alternate Landing">
          <AlternateLanding />
        </PublicRouteWrapper>
      } />
      <Route path="/alternate2" element={
        <PublicRouteWrapper routeName="Alternate 2 Landing">
          <Alternate2Landing />
        </PublicRouteWrapper>
      } />
      <Route path="/alternate3" element={
        <PublicRouteWrapper routeName="Alternate 3 Proof First">
          <Alternate3 />
        </PublicRouteWrapper>
      } />
      <Route path="/alternate4" element={
        <PublicRouteWrapper routeName="Alternate 4 Manifesto">
          <Alternate4 />
        </PublicRouteWrapper>
      } />
      <Route path="/how-it-works" element={
        <PublicRouteWrapper routeName="How It Works">
          <HowItWorks />
        </PublicRouteWrapper>
      } />
      <Route path="/who-its-for" element={
        <PublicRouteWrapper routeName="Who It's For">
          <WhoItsFor />
        </PublicRouteWrapper>
      } />
      <Route path="/boundary-lab" element={
        <PublicRouteWrapper routeName="Boundary Lab">
          <BoundaryLab />
        </PublicRouteWrapper>
      } />
      <Route path="/ai-acceleration-score" element={
        <PublicRouteWrapper routeName="AI Acceleration Score">
          <AIAccelerationScore />
        </PublicRouteWrapper>
      } />
      
      {/* Legal Document Pages */}
      <Route path="/terms" element={
        <PublicRouteWrapper routeName="Terms of Service">
          <Terms />
        </PublicRouteWrapper>
      } />
      <Route path="/privacy" element={
        <PublicRouteWrapper routeName="Privacy Policy">
          <Privacy />
        </PublicRouteWrapper>
      } />
      <Route path="/data-processing" element={
        <PublicRouteWrapper routeName="Data Processing Agreement">
          <DataProcessing />
        </PublicRouteWrapper>
      } />
      
      {/* VERA Conversation Interface (Demo) */}
      <Route path="/vera" element={
        <PublicRouteWrapper routeName="Talk to VERA">
          <VERAConversation />
        </PublicRouteWrapper>
      } />
      
      {/* Workflow Intelligence Library */}
      <Route path="/workflows" element={
        <PublicRouteWrapper routeName="Workflow Library">
          <WorkflowLibrary />
        </PublicRouteWrapper>
      } />

      {/* Public Website Resources */}
      <Route path="/industries" element={
        <PublicRouteWrapper routeName="Industries">
          <Industries />
        </PublicRouteWrapper>
      } />
      <Route path="/resources" element={
        <PublicRouteWrapper routeName="Resources">
          <Resources />
        </PublicRouteWrapper>
      } />
      <Route path="/velocity-calculator" element={
        <PublicRouteWrapper routeName="Velocity Calculator">
          <VelocityCalculator />
        </PublicRouteWrapper>
      } />
      <Route path="/investors" element={
        <PublicRouteWrapper routeName="Investor Relations">
          <Investors />
        </PublicRouteWrapper>
      } />
      <Route path="/white-papers" element={
        <PublicRouteWrapper routeName="White Papers">
          <WhitePapers />
        </PublicRouteWrapper>
      } />

      {/* Operational Redirects to Platform host */}
      <Route path="/login" element={<PlatformRedirect message="Redirecting to Platform Sign In..." />} />
      <Route path="/register" element={<PlatformRedirect message="Redirecting to Platform Registration..." />} />
      <Route path="/auth/callback" element={<PlatformRedirect message="Redirecting to Platform Auth..." />} />
      <Route path="/onboarding" element={<PlatformRedirect message="Redirecting to Platform Onboarding..." />} />
      <Route path="/enterprise/*" element={<PlatformRedirect />} />
      <Route path="/governance/*" element={<PlatformRedirect />} />
      <Route path="/agency/*" element={<PlatformRedirect />} />
      <Route path="/vendor/*" element={<PlatformRedirect />} />
      <Route path="/marketplace/*" element={<PlatformRedirect />} />
      <Route path="/portal/*" element={<PlatformRedirect />} />
      <Route path="/internal/*" element={<PlatformRedirect />} />
      <Route path="/admin/*" element={<PlatformRedirect />} />
      <Route path="/app/*" element={<PlatformRedirect />} />
      <Route path="/settings" element={<PlatformRedirect />} />
      <Route path="/notifications" element={<PlatformRedirect />} />
      <Route path="/search" element={<PlatformRedirect />} />
      <Route path="/submission/*" element={<PlatformRedirect />} />
      <Route path="/invite/*" element={<PlatformRedirect />} />
      <Route path="/agentic" element={<PlatformRedirect message="Redirecting to Agentic Governance..." />} />
      <Route path="/spine/:epsId" element={<PlatformRedirect message="Redirecting to Spine Decision Interface..." />} />

      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
