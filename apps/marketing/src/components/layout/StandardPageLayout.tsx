import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';

interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

interface MetaLoopBannerProps {
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'warning';
  lastUpdate?: string;
}

interface NavigationProps {
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  logoText?: string;
  logoOnClick?: () => void;
}

interface StandardPageLayoutProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: PageAction[];
  metaLoopBanner?: MetaLoopBannerProps;
  navigation?: NavigationProps;
  children: React.ReactNode;
  className?: string;
}

const MetaLoopBanner: React.FC<MetaLoopBannerProps> = ({ 
  title, 
  description, 
  status, 
  lastUpdate 
}) => {
  const { mode } = useMode();
  
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return mode === 'enterprise' ? 'bg-brand-teal/10 border-brand-teal/20' : 'bg-brand-coral/10 border-brand-coral/20';
      case 'warning':
        return 'bg-brand-orange/10 border-brand-orange/20';
      case 'inactive':
        return 'bg-muted border-border';
      default:
        return 'bg-muted border-border';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge 
            variant="outline" 
            className={`${mode === 'enterprise' ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/20' : 'bg-brand-coral/10 text-brand-coral border-brand-coral/20'}`}
          >
            MetaLoop Active
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-brand-orange/10 text-brand-orange border-brand-orange/20">
            Needs Attention
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Inactive
          </Badge>
        );
    }
  };

  return (
    <Card className={`mb-6 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>
        {lastUpdate && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

export const StandardPageLayout: React.FC<StandardPageLayoutProps> = ({
  title,
  subtitle,
  description,
  actions = [],
  metaLoopBanner,
  navigation,
  children,
  className = ''
}) => {
  const { mode } = useMode();

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Optional Navigation Header */}
      {navigation && (
        <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {navigation.logoText && (
                  <Button
                    variant="ghost"
                    onClick={navigation.logoOnClick}
                    className="text-xl font-bold hover:bg-transparent"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    {navigation.logoText}
                  </Button>
                )}
              </div>
              
              {navigation.showBackButton && (
                <Button
                  variant="outline"
                  onClick={navigation.onBackClick}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{navigation.backButtonText || 'Back to Home'}</span>
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <div className="max-w-7xl mx-auto p-6">
        {/* MetaLoop Banner */}
        {metaLoopBanner && <MetaLoopBanner {...metaLoopBanner} />}
        
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <h2 className="text-lg text-muted-foreground">
                {subtitle}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  className={`
                    ${action.variant === 'default' && mode === 'enterprise' ? 'bg-brand-teal hover:bg-brand-teal/90' : ''}
                    ${action.variant === 'default' && mode === 'partner' ? 'bg-brand-coral hover:bg-brand-coral/90' : ''}
                  `}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StandardPageLayout;