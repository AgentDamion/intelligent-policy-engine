import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import NotFound from '@/pages/NotFound';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { VendorLayout } from '@/components/layout/VendorLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy load all page components for better performance
const Index = lazy(() => import('@/pages/Index'));
const Platform = lazy(() => import('@/pages/Platform'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const BackendTest = lazy(() => import('@/pages/BackendTest'));
const ProofCenter = lazy(() => import('@/pages/ProofCenter'));
const AIAccelerationScore = lazy(() => import('@/pages/AIAccelerationScore'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Contact = lazy(() => import('@/pages/Contact'));
const OnboardingComplete = lazy(() => import('@/pages/OnboardingComplete'));
const EnterpriseInvite = lazy(() => import('@/pages/enterprise/EnterpriseInvite'));
const InviteAgency = lazy(() => import('@/pages/enterprise/InviteAgency'));
const About = lazy(() => import('@/pages/About'));
const PharmaceuticalIndustry = lazy(() => import('@/pages/PharmaceuticalIndustry'));
const ToolRegistryTest = lazy(() => import('@/pages/ToolRegistryTest'));
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
const PolicySettings = lazy(() => import('@/pages/PolicySettings'));
const Auth = lazy(() => import('@/pages/Auth'));
const Agentic = lazy(() => import('@/pages/Agentic'));
const Spine = lazy(() => import('@/pages/Spine'));
// New Marketing Pages
const VERAConversation = lazy(() => import('@/pages/VERAConversation'));
const WorkflowLibrary = lazy(() => import('@/pages/WorkflowLibrary'));
const MissionControlDemo = lazy(() => import('@/pages/MissionControlDemo'));
// Legal Document Pages
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const DataProcessing = lazy(() => import('@/pages/DataProcessing'));

const EnterpriseDashboard = lazy(() => import('@/pages/EnterpriseDashboard'));
const Analytics = lazy(() => import('@/pages/enterprise/Analytics'));
const PoliciesPage = lazy(() => import('@/pages/PoliciesPage'));
const PolicyStudio = lazy(() => import('@/pages/PolicyStudio'));
const Workflows = lazy(() => import('@/pages/enterprise/Workflows'));
const WorkflowRuns = lazy(() => import('@/pages/enterprise/WorkflowRuns'));
const AuditTrail = lazy(() => import('@/pages/enterprise/AuditTrail'));

// Auth Pages
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const PartnersPage = lazy(() => import('@/pages/PartnersPage'));
const ToolIntelligence = lazy(() => import('@/pages/enterprise/ToolIntelligence'));
const MarketplaceDashboard = lazy(() => import('@/pages/MarketplaceDashboard'));
const EnterpriseSubmissions = lazy(() => import('@/pages/enterprise/EnterpriseSubmissions'));
const Decisions = lazy(() => import('@/pages/enterprise/Decisions'));
const SubmissionDetail = lazy(() => import('@/pages/enterprise/SubmissionDetail'));
const DecisionDetail = lazy(() => import('@/pages/enterprise/DecisionDetail'));
const PlatformIntegrations = lazy(() => import('@/pages/enterprise/PlatformIntegrations'));
const PlatformIntegrationsDemo = lazy(() => import('@/pages/enterprise/PlatformIntegrationsDemo'));
const ClientPlatformIntegrations = lazy(() => import('@/pages/agency/ClientPlatformIntegrations'));
const PolicyImportWizard = lazy(() => import('@/pages/enterprise/PolicyImportWizard'));
const GovernanceInboxPage = lazy(() => import('@/pages/enterprise/GovernanceInboxPage'));
const GovernancePoliciesPage = lazy(() => import('@/pages/enterprise/governance/PoliciesPage'));
const GovernanceAuditsPage = lazy(() => import('@/pages/enterprise/governance/AuditsPage'));
const GovernanceToolsPage = lazy(() => import('@/pages/enterprise/governance/ToolsPage'));
const GovernanceAnalyticsPage = lazy(() => import('@/pages/enterprise/governance/AnalyticsPage'));
const Sandbox = lazy(() => import('@/pages/enterprise/Sandbox'));

// Dev Tools
const LinkHealthDashboard = lazy(() => import('@/pages/dev/LinkHealthDashboard'));

// Marketplace Application Pages
const MarketplaceHome = lazy(() => import('@/pages/marketplace/MarketplaceHome'));
const ToolCatalog = lazy(() => import('@/pages/marketplace/ToolCatalog'));
const MarketplaceAdmin = lazy(() => import('@/pages/marketplace/MarketplaceAdmin'));

// Vendor Pages
const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));
const VendorTools = lazy(() => import('@/pages/vendor/VendorTools'));
const VendorToolSubmission = lazy(() => import('@/pages/vendor/VendorToolSubmission'));
const VendorSubmissions = lazy(() => import('@/pages/vendor/VendorSubmissions'));
const VendorPromotions = lazy(() => import('@/pages/vendor/VendorPromotions'));
const VendorAnalytics = lazy(() => import('@/pages/vendor/VendorAnalytics'));
const VendorSettings = lazy(() => import('@/pages/vendor/VendorSettings'));

const AgencyDashboard = lazy(() => import('@/pages/agency/AgencyDashboard'));
const Performance = lazy(() => import('@/pages/agency/Performance'));
const Requirements = lazy(() => import('@/pages/agency/Requirements'));
const ComplianceStatus = lazy(() => import('@/pages/agency/ComplianceStatus'));
const AIReadiness = lazy(() => import('@/pages/agency/AIReadiness'));
const MyTools = lazy(() => import('@/pages/agency/MyTools'));
const Integrations = lazy(() => import('@/pages/agency/Integrations'));
const ProjectSetup = lazy(() => import('@/pages/ProjectSetup'));
const AIToolTracking = lazy(() => import('@/pages/agency/AIToolTracking'));
const PartnerTrustCenter = lazy(() => import('@/pages/PartnerTrustCenter'));
const AgencySubmissions = lazy(() => import('@/pages/agency/AgencySubmissions'));
const AgencySubmissionDetail = lazy(() => import('@/pages/agency/AgencySubmissionDetail'));
const RFPResponseEditor = lazy(() => import('@/pages/agency/RFPResponseEditor'));
const RFPResponseEditorPage = lazy(() => import('@/pages/agency/RFPResponseEditorPage'));
const PolicyRequestsInboxPage = lazy(() => import('@/pages/agency/PolicyRequestsInboxPage'));
const PolicyRequestResponsesPage = lazy(() => import('@/pages/agency/PolicyRequestResponsesPage'));
const KnowledgeBasePage = lazy(() => import('@/pages/agency/KnowledgeBasePage'));
const Reviews = lazy(() => import('@/pages/agency/Reviews'));
const Conflicts = lazy(() => import('@/pages/agency/Conflicts'));

const Notifications = lazy(() => import('@/pages/shared/Notifications'));
const SearchResults = lazy(() => import('@/pages/shared/SearchResults'));
const Settings = lazy(() => import('@/pages/shared/Settings'));
const ToolDetails = lazy(() => import('@/pages/shared/ToolDetails'));
const PartnerProfile = lazy(() => import('@/pages/shared/PartnerProfile'));

const InviteEntryPage = lazy(() => import('@/pages/InviteEntryPage'));
const SubmissionPage = lazy(() => import('@/pages/SubmissionPage'));
const SubmissionConfirmation = lazy(() => import('@/pages/SubmissionConfirmation'));
const LighthouseDemo = lazy(() => import('@/pages/LighthouseDemo'));
const PartnerDashboard = lazy(() => import('@/pages/PartnerDashboard'));
const TierDemo = lazy(() => import('@/pages/TierDemo'));
const DocumentProcessingDemo = lazy(() => import('@/pages/DocumentProcessingDemo'));
const TestPolicySubmission = lazy(() => import('@/pages/TestPolicySubmission'));
const TestPolicyEvaluate = lazy(() => import('@/pages/TestPolicyEvaluate'));

const RouteSchema = lazy(() => import('@/pages/dev/RouteSchema'));
const SpecStatusDashboard = lazy(() => import('@/pages/dev/SpecStatusDashboard'));
const VelocityCalculator = lazy(() => import('@/pages/public/VelocityCalculator'));
const Portal = lazy(() => import('@/pages/portal/Portal'));
const Admin = lazy(() => import('@/pages/admin/Admin'));

// Customer Portal Pages
const PortalDashboard = lazy(() => import('@/pages/portal/Dashboard'));
const Billing = lazy(() => import('@/pages/portal/Billing'));

// Internal Business Operations Pages
const InternalDashboard = lazy(() => import('@/pages/internal/Dashboard'));
const InternalSales = lazy(() => import('@/pages/internal/Sales'));
const InternalFinance = lazy(() => import('@/pages/internal/Finance'));
const InternalMarketing = lazy(() => import('@/pages/internal/Marketing'));
const InternalPartners = lazy(() => import('@/pages/internal/Partners'));
const GovernanceHealth = lazy(() => import('@/pages/internal/GovernanceHealth'));
const PolicyHierarchy = lazy(() => import('@/pages/governance/PolicyHierarchy'));
const AdminRouteWrapper = lazy(() => import('@/components/admin/AdminRouteWrapper').then(module => ({ default: module.AdminRouteWrapper })));

// Agency Admin Pages
const AgencyTeamManagement = lazy(() => import('@/pages/agency/admin/TeamManagement'));
const AgencyClientManagement = lazy(() => import('@/pages/agency/admin/ClientManagement'));
const AgencyProjectOversight = lazy(() => import('@/pages/agency/admin/ProjectOversight'));
const AgencySettings = lazy(() => import('@/pages/agency/admin/AgencySettings'));

// Enterprise Admin Pages
const EnterpriseUserManagement = lazy(() => import('@/pages/enterprise/admin/UserManagement'));
const EnterpriseRoleManagement = lazy(() => import('@/pages/enterprise/admin/RoleManagement'));
const EnterpriseOrganizationSettings = lazy(() => import('@/pages/enterprise/admin/OrganizationSettings'));
const EnterpriseComplianceSettings = lazy(() => import('@/pages/enterprise/admin/ComplianceSettings'));
const EnterpriseBilling = lazy(() => import('@/pages/enterprise/admin/Billing'));

// Public Website Pages
const Industries = lazy(() => import('@/pages/public/Industries'));
const Resources = lazy(() => import('@/pages/public/Resources'));
const Investors = lazy(() => import('@/pages/Investors'));
const WhitePapers = lazy(() => import('@/pages/WhitePapers'));

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

// Enterprise Route Wrapper - Uses Enterprise Layout
interface EnterpriseRouteWrapperProps {
  children: React.ReactNode;
  routeName?: string;
}

const EnterpriseRouteWrapper: React.FC<EnterpriseRouteWrapperProps> = ({ children, routeName }) => {
  return (
    <Suspense fallback={<RouteLoadingSpinner routeName={routeName} />}>
      <ProtectedRoute>
        <EnterpriseLayout>
          {children}
        </EnterpriseLayout>
      </ProtectedRoute>
    </Suspense>
  );
};

// Partner Route Wrapper - Uses Partner Layout
interface PartnerRouteWrapperProps {
  children: React.ReactNode;
  routeName?: string;
}

const PartnerRouteWrapper: React.FC<PartnerRouteWrapperProps> = ({ children, routeName }) => {
  return (
    <Suspense fallback={<RouteLoadingSpinner routeName={routeName} />}>
      <ProtectedRoute>
        <PartnerLayout>
          {children}
        </PartnerLayout>
      </ProtectedRoute>
    </Suspense>
  );
};

// Protected Route Wrapper - Uses Standard App Layout
interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
  routeName?: string;
}

const ProtectedRouteWrapper: React.FC<ProtectedRouteWrapperProps> = ({ children, routeName }) => {
  return (
    <Suspense fallback={<RouteLoadingSpinner routeName={routeName} />}>
      <ProtectedRoute>
        <AppLayout>
          {children}
        </AppLayout>
      </ProtectedRoute>
    </Suspense>
  );
};

// Public Route Wrapper
interface PublicRouteWrapperProps {
  children: React.ReactNode;
  routeName?: string;
}

const PublicRouteWrapper: React.FC<PublicRouteWrapperProps> = ({ children, routeName }) => {
  return (
    <Suspense fallback={<RouteLoadingSpinner routeName={routeName} />}>
      {children}
    </Suspense>
  );
};

// Vendor Route Wrapper - Uses Vendor Layout
interface VendorRouteWrapperProps {
  children: React.ReactNode;
  routeName?: string;
}

const VendorRouteWrapper: React.FC<VendorRouteWrapperProps> = ({ children, routeName }) => {
  return (
    <Suspense fallback={<RouteLoadingSpinner routeName={routeName} />}>
      <ProtectedRoute>
        <VendorLayout>
          {children}
        </VendorLayout>
      </ProtectedRoute>
    </Suspense>
  );
};

export const LazyRouteManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <Routes>
      {/* Public Routes - No Layout */}
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
      <Route path="/backend-test" element={
        <PublicRouteWrapper routeName="Backend Test">
          <BackendTest />
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
      <Route path="/onboarding" element={
        <PublicRouteWrapper routeName="Onboarding">
          <OnboardingComplete />
        </PublicRouteWrapper>
      } />
      <Route path="/enterprise-invite" element={
        <PublicRouteWrapper routeName="Enterprise Invitation">
          <EnterpriseInvite />
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
      <Route path="/tool-registry-test" element={
        <PublicRouteWrapper routeName="Tool Registry Test">
          <ToolRegistryTest />
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
      <Route path="/policy-settings" element={
        <PublicRouteWrapper routeName="Policy Settings">
          <PolicySettings />
        </PublicRouteWrapper>
      } />
      <Route path="/login" element={
        <PublicRouteWrapper routeName="Sign In">
          <Login />
        </PublicRouteWrapper>
      } />
      <Route path="/register" element={
        <PublicRouteWrapper routeName="Register">
          <Register />
        </PublicRouteWrapper>
      } />
      <Route path="/auth/callback" element={
        <PublicRouteWrapper routeName="Email Confirmation">
          <AuthCallback />
        </PublicRouteWrapper>
      } />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      
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
      
      {/* Agentic Governance UI - Public (temporarily) */}
      <Route path="/agentic" element={
        <PublicRouteWrapper routeName="Agentic Governance">
          <Agentic />
        </PublicRouteWrapper>
      } />
      
      {/* Standalone Spine Decision Interface */}
      <Route path="/spine/:epsId" element={
        <PublicRouteWrapper routeName="Spine Decision Interface">
          <Spine />
        </PublicRouteWrapper>
      } />
      
      {/* VERA Conversation Interface */}
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
      
      {/* Enterprise Routes - Protected with Enterprise Layout */}
      <Route path="/enterprise/dashboard" element={
        <EnterpriseRouteWrapper routeName="Enterprise Dashboard">
          <EnterpriseDashboard />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/analytics" element={
        <EnterpriseRouteWrapper routeName="Analytics">
          <Analytics />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/policies" element={
        <EnterpriseRouteWrapper routeName="Policies">
          <PoliciesPage />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/policies/new" element={
        <EnterpriseRouteWrapper routeName="Policy Studio">
          <PolicyStudio />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/policies/:id" element={
        <EnterpriseRouteWrapper routeName="Policy Studio">
          <PolicyStudio />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/policy-hierarchy" element={
        <EnterpriseRouteWrapper routeName="Policy Hierarchy">
          <PolicyHierarchy />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/workflows" element={
        <EnterpriseRouteWrapper routeName="Workflows">
          <Workflows />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/workflows/runs" element={
        <EnterpriseRouteWrapper routeName="Workflow Runs">
          <WorkflowRuns />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/audit-trail" element={
        <EnterpriseRouteWrapper routeName="Audit Trail">
          <AuditTrail />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/sandbox" element={
        <EnterpriseRouteWrapper routeName="Policy Sandbox">
          <Sandbox />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/mission-control" element={
        <PublicRouteWrapper routeName="VERA Mission Control">
          <MissionControlDemo />
        </PublicRouteWrapper>
      } />
      <Route path="/enterprise/partners" element={
        <EnterpriseRouteWrapper routeName="Partners">
          <PartnersPage />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/partners/:id" element={
        <EnterpriseRouteWrapper routeName="Partner Profile">
          <PartnerProfile />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/partners/invite" element={
        <EnterpriseRouteWrapper routeName="Invite Agency">
          <InviteAgency />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/platform-integrations" element={
        <EnterpriseRouteWrapper routeName="Platform Integrations">
          <PlatformIntegrations />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/platform-integrations-demo" element={
        <EnterpriseRouteWrapper routeName="Platform Integrations Demo">
          <PlatformIntegrationsDemo />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/import-policy" element={
        <EnterpriseRouteWrapper routeName="Import Policy">
          <PolicyImportWizard />
        </EnterpriseRouteWrapper>
      } />
      
      {/* Governance Routes */}
      <Route path="/governance/inbox" element={
        <EnterpriseRouteWrapper routeName="Governance Inbox">
          <GovernanceInboxPage />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/governance/policies" element={
        <EnterpriseRouteWrapper routeName="Governance Policies">
          <GovernancePoliciesPage />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/governance/audits" element={
        <EnterpriseRouteWrapper routeName="Governance Audits">
          <GovernanceAuditsPage />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/governance/tools" element={
        <EnterpriseRouteWrapper routeName="Governance Tools">
          <GovernanceToolsPage />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/governance/analytics" element={
        <EnterpriseRouteWrapper routeName="Governance Analytics">
          <GovernanceAnalyticsPage />
        </EnterpriseRouteWrapper>
      } />
      
      <Route path="/enterprise/marketplace-dashboard" element={
        <EnterpriseRouteWrapper routeName="Marketplace Dashboard">
          <MarketplaceDashboard />
        </EnterpriseRouteWrapper>
      } />
      {/* Marketplace Application Routes */}
      <Route path="/marketplace" element={
        <PublicRouteWrapper routeName="Marketplace">
          <MarketplaceHome />
        </PublicRouteWrapper>
      } />
      <Route path="/marketplace/tools" element={
        <PublicRouteWrapper routeName="Tool Catalog">
          <ToolCatalog />
        </PublicRouteWrapper>
      } />
      <Route path="/enterprise/marketplace/tools/:id" element={
        <EnterpriseRouteWrapper routeName="Tool Details">
          <ToolDetails />
        </EnterpriseRouteWrapper>
      } />
      {/* Vendor Routes */}
      <Route path="/vendor/dashboard" element={
        <VendorRouteWrapper routeName="Vendor Dashboard">
          <VendorDashboard />
        </VendorRouteWrapper>
      } />
      <Route path="/vendor/tools" element={
        <VendorRouteWrapper routeName="My Tools">
          <VendorTools />
        </VendorRouteWrapper>
      } />
      <Route path="/vendor/tools/new" element={
        <VendorRouteWrapper routeName="Submit Tool">
          <VendorToolSubmission />
        </VendorRouteWrapper>
      } />
      <Route path="/vendor/submissions" element={
        <VendorRouteWrapper routeName="Submissions">
          <VendorSubmissions />
        </VendorRouteWrapper>
      } />
      <Route path="/vendor/promotions" element={
        <VendorRouteWrapper routeName="Promotions">
          <VendorPromotions />
        </VendorRouteWrapper>
      } />
      <Route path="/vendor/analytics" element={
        <VendorRouteWrapper routeName="Analytics">
          <VendorAnalytics />
        </VendorRouteWrapper>
      } />
      <Route path="/vendor/settings" element={
        <VendorRouteWrapper routeName="Settings">
          <VendorSettings />
        </VendorRouteWrapper>
      } />
      <Route path="/marketplace/admin" element={
        <EnterpriseRouteWrapper routeName="Marketplace Admin">
          <MarketplaceAdmin />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/tool-intelligence" element={
        <EnterpriseRouteWrapper routeName="Tool Intelligence">
          <ToolIntelligence />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/submissions" element={
        <EnterpriseRouteWrapper routeName="Submissions">
          <EnterpriseSubmissions />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/submissions/:id" element={
        <EnterpriseRouteWrapper routeName="Submission Detail">
          <SubmissionDetail />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/decisions" element={
        <EnterpriseRouteWrapper routeName="Decisions">
          <Decisions />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/decisions/:id" element={
        <EnterpriseRouteWrapper routeName="Decision Detail">
          <DecisionDetail />
        </EnterpriseRouteWrapper>
      } />

      {/* Backward Compatibility Redirects - Old routes to new /enterprise/* routes */}
      <Route path="/dashboard" element={<Navigate to="/enterprise/dashboard" replace />} />
      <Route path="/analytics" element={<Navigate to="/enterprise/analytics" replace />} />
      <Route path="/policies" element={<Navigate to="/enterprise/policies" replace />} />
      <Route path="/policies/new" element={<Navigate to="/enterprise/policies/new" replace />} />
      <Route path="/policies/:id" element={<Navigate to="/enterprise/policies/:id" replace />} />
      <Route path="/workflows" element={<Navigate to="/enterprise/workflows" replace />} />
      <Route path="/workflows/runs" element={<Navigate to="/enterprise/workflows/runs" replace />} />
      <Route path="/audit-trail" element={<Navigate to="/enterprise/audit-trail" replace />} />
      <Route path="/partners" element={<Navigate to="/enterprise/partners" replace />} />
      <Route path="/partners/:id" element={<Navigate to="/enterprise/partners/:id" replace />} />
      <Route path="/partners/invite" element={<Navigate to="/enterprise/partners/invite" replace />} />
      <Route path="/marketplace-dashboard" element={<Navigate to="/enterprise/marketplace-dashboard" replace />} />
      <Route path="/marketplace/tools/:id" element={<Navigate to="/enterprise/marketplace/tools/:id" replace />} />
      <Route path="/tool-intelligence" element={<Navigate to="/enterprise/tool-intelligence" replace />} />
      <Route path="/submissions" element={<Navigate to="/enterprise/submissions" replace />} />
      <Route path="/submissions/:id" element={<Navigate to="/enterprise/submissions/:id" replace />} />
      <Route path="/decisions" element={<Navigate to="/enterprise/decisions" replace />} />
      <Route path="/decisions/:id" element={<Navigate to="/enterprise/decisions/:id" replace />} />
      <Route path="/enterprise-dashboard" element={<Navigate to="/enterprise/dashboard" replace />} />

      {/* Partner Dashboard - Protected with PartnerLayout */}
      <Route path="/agency/dashboard" element={
        <PartnerRouteWrapper routeName="Agency Dashboard">
          <AgencyDashboard />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/performance" element={
        <PartnerRouteWrapper routeName="Performance">
          <Performance />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/requirements" element={
        <PartnerRouteWrapper routeName="Requirements">
          <Requirements />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/compliance-status" element={
        <PartnerRouteWrapper routeName="Compliance Status">
          <ComplianceStatus />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/ai-readiness" element={
        <PartnerRouteWrapper routeName="AI Readiness">
          <AIReadiness />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/my-tools" element={
        <PartnerRouteWrapper routeName="My Tools">
          <MyTools />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/integrations" element={
        <PartnerRouteWrapper routeName="Integrations">
          <Integrations />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/project-setup" element={
        <PartnerRouteWrapper routeName="Project Setup">
          <ProjectSetup />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/ai-tool-tracking" element={
        <PartnerRouteWrapper routeName="AI Tool Tracking">
          <AIToolTracking />
        </PartnerRouteWrapper>
      } />
      
      {/* New App Routes - Map to existing components */}
      <Route path="/app/tools" element={
        <PartnerRouteWrapper routeName="Tool Inventory">
          <AIToolTracking />
        </PartnerRouteWrapper>
      } />
      <Route path="/app/policies" element={
        <EnterpriseRouteWrapper routeName="Policy Studio">
          <PolicyStudio />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/app/audit" element={
        <EnterpriseRouteWrapper routeName="Audit Trail">
          <AuditTrail />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/app/readiness" element={
        <EnterpriseRouteWrapper routeName="AI Readiness">
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            {React.createElement(lazy(() => import('@/pages/app/AIReadiness')))}
          </Suspense>
        </EnterpriseRouteWrapper>
      } />
      <Route path="/app/tools" element={
        <EnterpriseRouteWrapper routeName="My Tools">
          <MyTools />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/agency/submissions" element={
        <PartnerRouteWrapper routeName="Agency Submissions">
          <AgencySubmissions />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/submissions/:id" element={
        <PartnerRouteWrapper routeName="Submission Detail">
          <AgencySubmissionDetail />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/policy-request-response/:id" element={
        <PartnerRouteWrapper routeName="Policy Request Response">
          <RFPResponseEditor />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/policy-request/:distributionId/respond" element={
        <PartnerRouteWrapper routeName="Policy Request Response">
          <RFPResponseEditorPage />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/policy-requests" element={
        <PartnerRouteWrapper routeName="Policy Requests">
          <PolicyRequestsInboxPage />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/policy-request-responses" element={
        <PartnerRouteWrapper routeName="Policy Request Responses">
          <PolicyRequestResponsesPage />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/policy-request-response/new" element={
        <PartnerRouteWrapper routeName="New Policy Request Response">
          <RFPResponseEditorPage />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/knowledge-base" element={
        <PartnerRouteWrapper routeName="Knowledge Base">
          <KnowledgeBasePage />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/reviews" element={
        <PartnerRouteWrapper routeName="Reviews">
          <Reviews />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/conflicts" element={
        <PartnerRouteWrapper routeName="Conflicts">
          <Conflicts />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/trust-center" element={
        <PartnerRouteWrapper routeName="Trust Center">
          <PartnerTrustCenter />
        </PartnerRouteWrapper>
      } />
      <Route path="/requirements" element={
        <PartnerRouteWrapper routeName="Requirements">
          <Requirements />
        </PartnerRouteWrapper>
      } />

      {/* Shared Utility Routes */}
      <Route path="/notifications" element={
        <ProtectedRouteWrapper routeName="Notifications">
          <Notifications />
        </ProtectedRouteWrapper>
      } />
      <Route path="/search" element={
        <ProtectedRouteWrapper routeName="Search">
          <SearchResults />
        </ProtectedRouteWrapper>
      } />
      <Route path="/settings" element={
        <EnterpriseRouteWrapper routeName="Settings">
          <Settings />
        </EnterpriseRouteWrapper>
      } />

      {/* Demo and Submission Routes */}
      <Route path="/invite/:token" element={
        <PublicRouteWrapper routeName="Invite">
          <InviteEntryPage />
        </PublicRouteWrapper>
      } />
      <Route path="/submission" element={
        <PublicRouteWrapper routeName="Submission">
          <SubmissionPage />
        </PublicRouteWrapper>
      } />
      <Route path="/submission-confirmation" element={
        <PublicRouteWrapper routeName="Submission Confirmation">
          <SubmissionConfirmation />
        </PublicRouteWrapper>
      } />
      <Route path="/lighthouse" element={
        <ProtectedRouteWrapper routeName="Lighthouse Demo">
          <LighthouseDemo />
        </ProtectedRouteWrapper>
      } />
      <Route path="/demo" element={
        <ProtectedRouteWrapper routeName="Demo">
          <PartnerDashboard />
        </ProtectedRouteWrapper>
      } />
      <Route path="/tier-demo" element={
        <PublicRouteWrapper routeName="Tier Demo">
          <TierDemo />
        </PublicRouteWrapper>
      } />
      <Route path="/document-processing-demo" element={
        <PublicRouteWrapper routeName="Document Processing Demo">
          <DocumentProcessingDemo />
        </PublicRouteWrapper>
      } />
      <Route path="/test-policy-submission" element={
        <PublicRouteWrapper routeName="Test Policy Submission">
          <TestPolicySubmission />
        </PublicRouteWrapper>
      } />
      <Route path="/test-policy-evaluate" element={
        <PublicRouteWrapper routeName="Test Policy Evaluate">
          <TestPolicyEvaluate />
        </PublicRouteWrapper>
      } />

      {/* Legacy Routes */}
      <Route path="/project-setup" element={
        <ProtectedRouteWrapper routeName="Project Setup">
          <ProjectSetup />
        </ProtectedRouteWrapper>
      } />

      {/* Development Routes */}
      <Route path="/dev/spec-status" element={
        <ProtectedRouteWrapper routeName="Spec Status Dashboard">
          <SpecStatusDashboard />
        </ProtectedRouteWrapper>
      } />

      {/* Customer Portal Routes */}
      <Route path="/portal/dashboard" element={
        <ProtectedRouteWrapper routeName="Portal Dashboard">
          <PortalDashboard />
        </ProtectedRouteWrapper>
      } />
      <Route path="/portal/billing" element={
        <ProtectedRouteWrapper routeName="Billing">
          <Billing />
        </ProtectedRouteWrapper>
      } />

      {/* Internal Business Operations Routes - Using dedicated Admin layout */}
      <Route path="/internal/dashboard" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Admin Dashboard" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <InternalDashboard />
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/internal/finance" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Finance & Billing" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <InternalFinance />
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/internal/marketing" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Marketing Operations" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <InternalMarketing />
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/internal/partners" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Partner Management" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <InternalPartners />
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/internal/governance" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Governance Health" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <GovernanceHealth />
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/governance/hierarchy" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Policy Hierarchy" />}>
          <ProtectedRoute>
            <AppLayout>
              <PolicyHierarchy />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/internal/sales" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Sales & Customer Management" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <InternalSales />
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />
      <Route path="/internal/*" element={
        <Suspense fallback={<RouteLoadingSpinner routeName="Admin Section" />}>
          <ProtectedRoute>
            <AdminRouteWrapper>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Admin Section</h2>
                <p className="text-muted-foreground">This admin section is under development.</p>
              </div>
            </AdminRouteWrapper>
          </ProtectedRoute>
        </Suspense>
      } />

      {/* Agency Admin Routes */}
      <Route path="/agency/admin/team" element={
        <PartnerRouteWrapper routeName="Agency Team Management">
          <AgencyTeamManagement />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/admin/clients" element={
        <PartnerRouteWrapper routeName="Agency Client Management">
          <AgencyClientManagement />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/admin/projects" element={
        <PartnerRouteWrapper routeName="Agency Project Oversight">
          <AgencyProjectOversight />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/admin/settings" element={
        <PartnerRouteWrapper routeName="Agency Settings">
          <AgencySettings />
        </PartnerRouteWrapper>
      } />
      <Route path="/agency/platform-integrations" element={
        <PartnerRouteWrapper routeName="Client Platform Integrations">
          <ClientPlatformIntegrations />
        </PartnerRouteWrapper>
      } />

      {/* Enterprise Admin Routes */}
      <Route path="/enterprise/admin/users" element={
        <EnterpriseRouteWrapper routeName="Enterprise User Management">
          <EnterpriseUserManagement />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/admin/roles" element={
        <EnterpriseRouteWrapper routeName="Enterprise Role Management">
          <EnterpriseRoleManagement />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/admin/settings" element={
        <EnterpriseRouteWrapper routeName="Enterprise Organization Settings">
          <EnterpriseOrganizationSettings />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/admin/compliance" element={
        <EnterpriseRouteWrapper routeName="Enterprise Compliance Settings">
          <EnterpriseComplianceSettings />
        </EnterpriseRouteWrapper>
      } />
      <Route path="/enterprise/admin/billing" element={
        <EnterpriseRouteWrapper routeName="Enterprise Billing">
          <EnterpriseBilling />
        </EnterpriseRouteWrapper>
      } />

      {/* Public Website Routes */}
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

      {/* Legacy Routes */}
      <Route path="/velocity-calculator" element={
        <PublicRouteWrapper routeName="Velocity Calculator">
          <VelocityCalculator />
        </PublicRouteWrapper>
      } />
      <Route path="/portal" element={
        <PublicRouteWrapper routeName="Portal">
          <Portal />
        </PublicRouteWrapper>
      } />
      <Route path="/admin" element={
        <ProtectedRouteWrapper routeName="Admin">
          <Admin />
        </ProtectedRouteWrapper>
      } />

      {/* /app/* Route Aliases - Maintain backward compatibility */}
      <Route path="/app/agency/dashboard" element={
        <Navigate to="/agency/dashboard" replace />
      } />
      <Route path="/app/readiness" element={
        <PartnerRouteWrapper routeName="AI Readiness">
          <AIReadiness />
        </PartnerRouteWrapper>
      } />
      <Route path="/app/requirements" element={
        <PartnerRouteWrapper routeName="Requirements">
          <Requirements />
        </PartnerRouteWrapper>
      } />
      <Route path="/app/performance" element={
        <PartnerRouteWrapper routeName="Performance">
          <Performance />
        </PartnerRouteWrapper>
      } />
      <Route path="/app/tools" element={
        <PartnerRouteWrapper routeName="My Tools">
          <MyTools />
        </PartnerRouteWrapper>
      } />
      <Route path="/app/policies" element={
        <PartnerRouteWrapper routeName="Compliance Status">
          <ComplianceStatus />
        </PartnerRouteWrapper>
      } />
      <Route path="/app/audit" element={
        <PartnerRouteWrapper routeName="AI Tool Tracking">
          <AIToolTracking />
        </PartnerRouteWrapper>
      } />

      {/* Vendor Routes - Dedicated Vendor Portal - Moved to main vendor section above */}

      {/* Development Routes */}
      <Route path="/dev/route-schema" element={
        <ProtectedRouteWrapper routeName="Route Schema">
          <RouteSchema />
        </ProtectedRouteWrapper>
      } />
      <Route path="/dev/link-health" element={
        <ProtectedRouteWrapper routeName="Link Health Dashboard">
          <LinkHealthDashboard />
        </ProtectedRouteWrapper>
      } />
      
      {/* Public Website Pages */}
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

      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};