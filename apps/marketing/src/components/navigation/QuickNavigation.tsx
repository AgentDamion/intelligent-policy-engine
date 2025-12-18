import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Star, Clock, ArrowRight } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';
import { getAllManagedRoutes, getRoutesByMode } from '@/config/routes.config';
import { routes } from '@/lib/routes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface QuickNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickNavigation: React.FC<QuickNavProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useMode();

  // Get recent routes from sessionStorage
  const getRecentRoutes = () => {
    const journey = JSON.parse(sessionStorage.getItem('userJourney') || '[]');
    const recentPaths = journey
      .slice(-10)
      .map((step: any) => step.to)
      .filter((path: string, index: number, arr: string[]) => 
        arr.indexOf(path) === index && path !== location.pathname
      );
    return recentPaths;
  };

  // Get favorite routes from localStorage
  const getFavoriteRoutes = () => {
    return JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
  };

  const toggleFavorite = (path: string) => {
    const favorites = getFavoriteRoutes();
    const newFavorites = favorites.includes(path)
      ? favorites.filter((fav: string) => fav !== path)
      : [...favorites, path];
    localStorage.setItem('favoriteRoutes', JSON.stringify(newFavorites));
  };

  // Get available routes based on current mode
  const availableRoutes = useMemo(() => {
    const modeRoutes = getRoutesByMode(mode);
    const allRoutes = getAllManagedRoutes();
    
    return allRoutes.filter(route => {
      // Show routes relevant to current mode
      if (mode === 'enterprise') {
        return !route.path.startsWith('/agency/');
      } else {
        return route.path.startsWith('/agency/') || 
               ['overview', 'utility', 'demo'].includes(route.category);
      }
    });
  }, [mode]);

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery) {
      return availableRoutes.slice(0, 8); // Show first 8 routes when no search
    }

    return availableRoutes.filter(route =>
      route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('description' in route && route.description && route.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, availableRoutes]);

  const recentRoutes = getRecentRoutes();
  const favoriteRoutes = getFavoriteRoutes();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredRoutes.length > 0) {
      handleNavigate(filteredRoutes[0].path);
    }
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Quick Navigation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages, features, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {/* Search Results or Default Routes */}
            {(searchQuery ? filteredRoutes : filteredRoutes).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {searchQuery ? 'Search Results' : 'Quick Access'}
                </h3>
                <div className="space-y-1">
                  {(searchQuery ? filteredRoutes : filteredRoutes).map((route) => (
                    <div
                      key={route.path}
                      onClick={() => handleNavigate(route.path)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer group transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{route.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {route.category}
                          </Badge>
                          {favoriteRoutes.includes(route.path) && (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        {'description' in route && route.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {route.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(route.path);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Star className={`h-4 w-4 ${favoriteRoutes.includes(route.path) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`} />
                        </button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Routes */}
            {recentRoutes.length > 0 && !searchQuery && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recently Visited
                </h3>
                <div className="space-y-1">
                  {recentRoutes.slice(0, 3).map((path) => {
                    const route = availableRoutes.find(r => r.path === path);
                    return route ? (
                      <div
                        key={path}
                        onClick={() => handleNavigate(path)}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <span className="text-sm">{route.title}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Favorites */}
            {favoriteRoutes.length > 0 && !searchQuery && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Favorites
                </h3>
                <div className="space-y-1">
                  {favoriteRoutes.map((path: string) => {
                    const route = availableRoutes.find(r => r.path === path);
                    return route ? (
                      <div
                        key={path}
                        onClick={() => handleNavigate(path)}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <span className="text-sm">{route.title}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to navigate to the first result
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};