import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RoleToggle } from './RoleToggle';

export const AdminTopBar: React.FC = () => {
  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          aicomply.io
        </div>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers, metrics, operations..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <RoleToggle />
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Admin Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};