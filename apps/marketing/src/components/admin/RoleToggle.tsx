import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCog, Crown, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { useAdminRole, AdminRole } from '@/contexts/AdminRoleContext';
import { cn } from '@/lib/utils';

const roleIcons = {
  founder: Crown,
  marketing: TrendingUp,
  finance: DollarSign,
  ops: Shield
};

const roleLabels = {
  founder: 'Founder',
  marketing: 'Marketing',
  finance: 'Finance',
  ops: 'Operations'
};

export const RoleToggle: React.FC = () => {
  const { role, setRole, getRoleConfig } = useAdminRole();
  const config = getRoleConfig();
  const CurrentIcon = roleIcons[role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-background">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{roleLabels[role]} View</span>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Role
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg">
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Switch Dashboard View
          </div>
          {(Object.keys(roleIcons) as AdminRole[]).map((roleKey) => {
            const Icon = roleIcons[roleKey];
            const isActive = role === roleKey;
            
            return (
              <DropdownMenuItem
                key={roleKey}
                onClick={() => setRole(roleKey)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{roleLabels[roleKey]}</div>
                  <div className="text-xs text-muted-foreground">
                    {roleKey === 'founder' && 'Executive overview'}
                    {roleKey === 'marketing' && 'Sales & campaigns'}
                    {roleKey === 'finance' && 'Revenue & billing'}
                    {roleKey === 'ops' && 'Compliance & tools'}
                  </div>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="text-xs text-muted-foreground">
            Current: <span className="font-medium">{config.title}</span>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {config.description}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};