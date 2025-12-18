import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProductCommandMenu } from '@/components/product/ProductCommandMenu';
import APISettingsModal from '@/components/settings/APISettingsModal';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { 
  Bell, 
  User, 
  Settings, 
  Search,
  Download,
  Activity,
  Plug,
  Eye
} from 'lucide-react';
import { useDemoMode } from '@/hooks/useDemoMode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const AppHeader: React.FC = () => {
  const { mode } = useMode();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [commandOpen, setCommandOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);


  const handleLogoClick = () => {
    if (mode === 'enterprise') {
      navigate(routes.enterprise.dashboard);
    } else {
      navigate(routes.agency.dashboard);
    }
  };

  type MetaLoopStatus = 'online' | 'syncing' | 'offline';
  const metaLoopStatus: MetaLoopStatus = 'online';
  
  const getStatusColor = (status: MetaLoopStatus) => {
    switch (status) {
      case 'online': return 'bg-brand-green';
      case 'syncing': return 'bg-brand-orange';
      case 'offline': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: MetaLoopStatus) => {
    switch (status) {
      case 'online': return 'MetaLoop Online - All systems operational';
      case 'syncing': return 'MetaLoop Syncing - Updates in progress';
      case 'offline': return 'MetaLoop Offline - System maintenance';
      default: return 'Unknown status';
    }
  };

  return (
    <TooltipProvider>
      <header className="h-14 border-b bg-brand-taupe sticky top-0 z-50">
        <div className="flex h-full items-center justify-between px-4 gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-foreground hover:bg-brand-taupe-dark" />
            
            {/* Logo with brand icon */}
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <BrandIcon size="medium" variant="light" />
              <span className="font-brand font-semibold text-foreground hidden sm:block">aicomplyr.io</span>
            </button>

          </div>

          {/* Center - Global Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies, tools, audits..."
                className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20"
                onFocus={() => setCommandOpen(true)}
                readOnly
              />
            </div>
          </div>

          {/* Right Side - Product Icons */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-brand-taupe-dark h-9 w-9"
                  onClick={() => navigate(routes.search)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-brand-taupe-dark h-9 w-9"
                  onClick={() => navigate(routes.notifications)}
                >
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-brand-coral rounded-full"></div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

            {/* Reports/Export */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-brand-taupe-dark h-9 w-9">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Reports</p>
              </TooltipContent>
            </Tooltip>

            {/* Demo Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`hover:bg-brand-taupe-dark h-9 w-9 ${isDemoMode ? 'text-brand-coral' : 'text-muted-foreground'}`}
                  onClick={toggleDemoMode}
                >
                  <div className="relative">
                    <Eye className="h-4 w-4" />
                    {isDemoMode && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
                    )}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDemoMode ? '🎬 Demo Mode Active' : '🔴 Live Data'}</p>
                <p className="text-xs text-muted-foreground">Click to toggle</p>
              </TooltipContent>
            </Tooltip>

            {/* MetaLoop Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-brand-taupe-dark h-9 w-9">
                  <div className="relative">
                    <Activity className="h-4 w-4" />
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(metaLoopStatus)}`} />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getStatusText(metaLoopStatus)}</p>
              </TooltipContent>
            </Tooltip>

            {/* API Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-brand-taupe-dark h-9 w-9"
                  onClick={() => setApiSettingsOpen(true)}
                >
                  <Plug className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>API Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-brand-taupe-dark h-9 w-9"
                  onClick={() => navigate(routes.settings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-brand-taupe-dark h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-lg z-50">
                <DropdownMenuItem className="hover:bg-muted" onClick={() => navigate(routes.settings)}>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-muted" onClick={() => navigate(routes.settings)}>
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-muted" onClick={signOut}>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <ProductCommandMenu 
        open={commandOpen} 
        onOpenChange={setCommandOpen} 
      />
      
      <APISettingsModal 
        open={apiSettingsOpen} 
        onOpenChange={setApiSettingsOpen} 
      />
    </TooltipProvider>
  );
};