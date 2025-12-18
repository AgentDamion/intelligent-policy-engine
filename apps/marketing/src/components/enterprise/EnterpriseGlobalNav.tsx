import React, { useState } from 'react';
import { Search, Bell, Download, Code, Settings, ChevronDown, User, UserCog, Building, CreditCard, FileText, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EnterpriseGlobalNavProps {
  className?: string;
}

export function EnterpriseGlobalNav({ className }: EnterpriseGlobalNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [metaLoopStatus] = useState<'compliant' | 'issues' | 'syncing'>('compliant');
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const statusConfig = {
    compliant: { label: 'Compliant', variant: 'default' as const, color: 'bg-brand-green' },
    issues: { label: 'Issues Flagged', variant: 'destructive' as const, color: 'bg-destructive' },
    syncing: { label: 'Syncing', variant: 'secondary' as const, color: 'bg-brand-orange' }
  };

  const currentStatus = statusConfig[metaLoopStatus];

  return (
    <header className={cn(
      "h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "flex items-center justify-between px-6 sticky top-0 z-50",
      className
    )}>
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <BrandLogo size="medium" showIcon className="flex-shrink-0" />
        <div className="hidden md:block">
          <SmartBreadcrumb />
        </div>
      </div>

      {/* Center Section - Global Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partners, policies, tools, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50 focus:bg-background"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" onClick={() => handleNavigation('/notifications')}>
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-brand-coral text-white">
            3
          </Badge>
        </Button>

        {/* Export Reports */}
        <Button variant="ghost" size="icon" onClick={() => console.log('Export reports functionality')}>
          <Download className="h-4 w-4" />
        </Button>

        {/* MetaLoop Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
          <div className={cn("w-2 h-2 rounded-full", currentStatus.color)} />
          <span className="text-sm font-medium">{currentStatus.label}</span>
        </div>

        {/* API Settings */}
        <Button variant="ghost" size="icon" onClick={() => handleNavigation('/enterprise/admin/settings')}>
          <Code className="h-4 w-4" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={() => handleNavigation('/enterprise/admin/settings')}>
          <Settings className="h-4 w-4" />
        </Button>

        {/* Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleNavigation('/enterprise/admin/settings')} className="cursor-pointer">
              <UserCog className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/enterprise/admin/compliance')} className="cursor-pointer">
              <Building className="h-4 w-4 mr-2" />
              Enterprise Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/enterprise/admin/billing')} className="cursor-pointer">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExternalLink('https://docs.aicomply.io')} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExternalLink('https://help.aicomply.io')} className="cursor-pointer">
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}