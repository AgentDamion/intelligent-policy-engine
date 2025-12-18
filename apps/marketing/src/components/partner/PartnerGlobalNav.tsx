import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Bell, 
  Download, 
  Activity, 
  Settings, 
  Code, 
  User,
  ChevronDown
} from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';

export const PartnerGlobalNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  // MetaLoop status
  const metaLoopStatus = 'compliant'; // 'compliant' | 'pending-review' | 'offline'
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-success text-success-foreground';
      case 'pending-review': return 'bg-warning text-warning-foreground';
      case 'offline': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant': return 'Compliant';
      case 'pending-review': return 'Pending Review';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <TooltipProvider>
      <header className="h-16 border-b bg-background sticky top-0 z-50">
        <div className="flex h-full items-center justify-between px-6 gap-6">
          {/* Left Side - Logo + Breadcrumb */}
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <BrandLogo 
              size="medium" 
              variant="light" 
              className="flex-shrink-0"
            />
            <div className="hidden md:block min-w-0">
              <SmartBreadcrumb />
            </div>
          </div>

          {/* Center - Global Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search client policies, tools, submissions..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 bg-muted/30 border-border focus:ring-2 focus:ring-brand-coral/20"
              />
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9"
                >
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-brand-coral rounded-full"></div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications (3 new)</p>
              </TooltipContent>
            </Tooltip>

            {/* Export Reports */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Reports</p>
              </TooltipContent>
            </Tooltip>

            {/* MetaLoop Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(metaLoopStatus)} px-3 py-1 text-xs font-medium`}
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    {getStatusText(metaLoopStatus)}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>MetaLoop compliance monitoring system</p>
              </TooltipContent>
            </Tooltip>

            {/* API Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>API Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 gap-2">
                  <div className="w-6 h-6 bg-brand-coral rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};