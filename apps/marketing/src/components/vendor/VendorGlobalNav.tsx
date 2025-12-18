import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Store, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const VendorGlobalNav: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to={routes.vendor.dashboard} className="mr-6 flex items-center space-x-2">
            <Store className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              AI Tool Vendor Hub
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            <Link 
              to={routes.vendor.dashboard} 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link 
              to={routes.vendor.tools} 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              My Tools
            </Link>
            <Link 
              to={routes.vendor.promotions} 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Promotions
            </Link>
            <Link 
              to={routes.vendor.analytics} 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Analytics
            </Link>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};