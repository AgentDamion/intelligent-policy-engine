import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/lib/routes';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { getRoutesByMode } from '@/config/routes.config';
import { QuickNavigation } from '@/components/navigation/QuickNavigation';
import { useRFPNotifications } from '@/hooks/useRFPNotifications';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Shield,
  Users,
  FileText,
  CheckSquare,
  FileCheck,
  Search,
  Brain,
  ShoppingCart,
  GitBranch,
  BarChart3,
  Zap,
  TrendingUp,
  Sun,
  Moon,
  LogOut,
  Inbox,
  Wrench,
  Plug,
  MessageSquare,
  AlertTriangle,
  FolderPlus,
  Activity,
  Command,
  FlaskConical,
  Network,
} from 'lucide-react';

const enterpriseNavGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: routes.enterprise.dashboard, icon: LayoutDashboard },
      { name: "Analytics", href: routes.enterprise.analytics, icon: BarChart3 },
    ]
  },
  {
    title: "Governance",
    items: [
      { name: "Policies", href: routes.enterprise.policies, icon: FileText },
      { name: "Policy Hierarchy", href: routes.enterprise.policyHierarchy, icon: Network },
      { name: "Workflows", href: routes.enterprise.workflows, icon: GitBranch },
      { name: "Policy Sandbox", href: routes.enterprise.sandbox, icon: FlaskConical },
      { name: "Audit Trail", href: routes.enterprise.auditTrail, icon: Search },
    ]
  },
  {
    title: "Partners & Tools",
    items: [
      { name: "Partners", href: routes.enterprise.partners, icon: Users },
      { name: "Tool Intelligence", href: routes.enterprise.toolIntelligence, icon: Brain },
      { name: "Marketplace", href: routes.enterprise.marketplaceDashboard, icon: ShoppingCart },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Submissions", href: routes.enterprise.submissions, icon: Inbox },
      { name: "Decisions", href: routes.enterprise.decisions, icon: CheckSquare },
      { name: "Document Processing", href: routes.documentProcessingDemo, icon: FileText },
      { name: "Demo Center", href: routes.demoHub, icon: Activity },
      { name: "Lighthouse Demo", href: routes.lighthouse, icon: Zap },
    ]
  }
];

const partnerNavGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: routes.agency.dashboard, icon: LayoutDashboard },
      { name: "Performance", href: routes.agency.performance, icon: TrendingUp },
    ]
  },
  {
    title: "Compliance",
    items: [
      { name: "Requirements", href: routes.agency.requirements, icon: FileCheck },
      { name: "Compliance Status", href: routes.agency.compliance, icon: Shield },
      { name: "AI Readiness", href: routes.agency.aiReadiness, icon: Brain },
    ]
  },
  {
    title: "Tools & Integration",
    items: [
      { name: "Project Setup", href: routes.agency.projectSetup, icon: FolderPlus },
      { name: "AI Tool Tracking", href: routes.agency.aiToolTracking, icon: Activity },
      { name: "Document Demo", href: routes.documentProcessingDemo, icon: Activity },
      { name: "My Tools", href: routes.agency.myTools, icon: Wrench },
      { name: "Marketplace", href: routes.enterprise.marketplaceDashboard, icon: ShoppingCart },
      { name: "Integrations", href: routes.agency.integrations, icon: Plug },
    ]
  },
  {
    title: "Requests & Submissions",
    items: [
      { name: "My Submissions", href: routes.agency.submissions, icon: FileText },
      { name: "Reviews", href: routes.agency.reviews, icon: MessageSquare },
      { name: "Policy Requests", href: routes.agency.policyRequests, icon: Inbox, badge: true },
      { name: "Policy Responses", href: routes.agency.policyRequestResponses, icon: FileText },
      { name: "Knowledge Base", href: routes.agency.knowledgeBase, icon: Brain },
      { name: "Conflicts", href: routes.agency.conflicts, icon: AlertTriangle },
    ]
  }
];

export const AppSidebar: React.FC = () => {
  const { mode } = useMode();
  const { signOut, profile } = useAuth();
  const { open } = useSidebar();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const { workspace } = useAgencyWorkspace();
  const rfpNotifications = useRFPNotifications(workspace?.id);

  const navGroups = mode === 'enterprise' ? enterpriseNavGroups : partnerNavGroups;
  const currentPath = location.pathname;

  // Debug navigation state
  useEffect(() => {
    console.group('🧭 AppSidebar Navigation Debug');
    console.log('Mode:', mode);
    console.log('Profile account_type:', profile?.account_type);
    console.log('Current Path:', currentPath);
    console.log('Nav Groups Length:', navGroups.length);
    const dashboardLink = navGroups.find(g => g.items?.find((i: any) => i.name === 'Dashboard'))?.items?.find((i: any) => i.name === 'Dashboard')?.href;
    console.log('Dashboard Link:', dashboardLink);
    console.groupEnd();
  }, [mode, profile?.account_type, currentPath, navGroups]);

  // Theme management
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const isDarkMode = theme === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isActive = (path: string) => currentPath === path;

  // Keyboard shortcut for quick navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickNav(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const MenuItemComponent = ({ item }: { item: any }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const showBadge = item.badge && item.href === routes.agency.policyRequests && rfpNotifications.total > 0;
    
    const menuButton = (
      <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
        <NavLink 
          to={item.href}
          className={`
            flex items-center gap-3 relative py-2 px-3 rounded-md transition-all duration-200
            ${active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            ${active ? 'border-l-2' : ''}
            ${active && mode === 'enterprise' ? 'border-l-brand-teal' : ''}
            ${active && mode === 'partner' ? 'border-l-brand-coral' : ''}
          `}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {open && <span className="text-sm">{item.name}</span>}
          {showBadge && open && (
            <Badge 
              variant={
                rfpNotifications.overdueCount > 0 ? 'destructive' : 
                rfpNotifications.dueSoonCount > 0 ? 'default' : 
                'secondary'
              }
              className="ml-auto"
            >
              {rfpNotifications.overdueCount > 0 
                ? `${rfpNotifications.overdueCount} overdue`
                : rfpNotifications.dueSoonCount > 0
                ? `${rfpNotifications.dueSoonCount} due`
                : `${rfpNotifications.newCount} new`
              }
            </Badge>
          )}
        </NavLink>
      </SidebarMenuButton>
    );

    if (!open) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {menuButton}
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.name}
            {showBadge && ` (${rfpNotifications.total})`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return menuButton;
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-border bg-background">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Brand icon - always visible */}
          <BrandIcon 
            size="medium" 
            variant="light" 
            className={mode === 'enterprise' ? 'text-brand-teal' : 'text-brand-coral'} 
          />
          {open && (
            <div className="flex flex-col">
              <span className="font-brand font-semibold text-sm text-foreground">aicomplyr.io</span>
              <span className="text-xs text-muted-foreground capitalize">{mode}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-background">
        {/* Quick Navigation Button */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setShowQuickNav(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Command className="h-4 w-4" />
            {open && (
              <>
                <span>Quick Navigation</span>
                <div className="ml-auto flex gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘</kbd>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">K</kbd>
                </div>
              </>
            )}
          </button>
        </div>

        {navGroups.map((group, groupIndex) => (
          <div key={group.title}>            
            {open && (
              <div className="px-4 py-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </span>
              </div>
            )}
            
            <SidebarMenu className="px-2 mb-6">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <MenuItemComponent item={item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border bg-background p-3">
        <div className="flex flex-col gap-2">
          {/* Theme Toggle */}
          <div className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted transition-colors ${!open ? 'justify-center' : ''}`}>
            {open ? (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Light</span>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-brand-teal"
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={toggleTheme} className="p-1 hover:bg-muted rounded">
                    {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Logout */}
          <div className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors ${!open ? 'justify-center' : ''}`}>
            {open ? (
              <button onClick={signOut} className="flex items-center gap-2 w-full">
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={signOut} className="p-1 hover:bg-muted rounded">
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </SidebarFooter>

      {/* Quick Navigation Modal */}
      <QuickNavigation
        isOpen={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />
    </Sidebar>
  );
};