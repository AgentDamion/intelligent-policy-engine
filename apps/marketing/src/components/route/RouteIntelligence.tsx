import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Navigation, Lightbulb, TrendingUp, Users, 
  ArrowRight, Clock, Target, Zap 
} from 'lucide-react';
import { getAllManagedRoutes, getRoutesByMode, routeCategories } from '@/config/routes.config';
import { useAuth } from '@/contexts/AuthContext';
import { demoMode } from '@/utils/demoMode';

interface RouteSuggestion {
  path: string;
  title: string;
  category: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedValue: string;
  icon: React.ReactNode;
}

interface RouteRecommendation {
  type: 'next-step' | 'completion' | 'optimization' | 'discovery';
  title: string;
  description: string;
  routes: RouteSuggestion[];
}

const RouteIntelligence: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [recommendations, setRecommendations] = useState<RouteRecommendation[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const getUserRole = () => {
    if (demoMode.isEnabled()) {
      return demoMode.getDemoRole() || 'enterprise';
    }
    return profile?.account_type || 'enterprise';
  };

  useEffect(() => {
    generateIntelligentRecommendations();
    
    // Show intelligence panel after user has been on page for 10 seconds
    const timer = setTimeout(() => setIsVisible(true), 10000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const generateIntelligentRecommendations = () => {
    const userRole = getUserRole();
    const allRoutes = getAllManagedRoutes();
    const roleRoutes = getRoutesByMode(userRole as 'enterprise' | 'partner');
    const currentPath = location.pathname;
    
    // Get user journey from storage
    const userJourney = JSON.parse(sessionStorage.getItem('userJourney') || '[]');
    const visitedPaths = userJourney.map((j: any) => j.to);
    const analytics = JSON.parse(sessionStorage.getItem('routeAnalytics') || '[]');
    
    const recommendations: RouteRecommendation[] = [];

    // 1. Next Logical Steps (based on current route)
    const nextSteps = getNextLogicalSteps(currentPath, userRole, visitedPaths);
    if (nextSteps.length > 0) {
      recommendations.push({
        type: 'next-step',
        title: 'Recommended Next Steps',
        description: 'Continue your workflow with these logical next actions',
        routes: nextSteps
      });
    }

    // 2. Workflow Completion (if user is in middle of a process)
    const completion = getWorkflowCompletion(currentPath, userRole, visitedPaths);
    if (completion.length > 0) {
      recommendations.push({
        type: 'completion',
        title: 'Complete Your Workflow',
        description: 'Finish what you started for maximum impact',
        routes: completion
      });
    }

    // 3. Feature Discovery (unused valuable features)
    const discovery = getFeatureDiscovery(userRole, visitedPaths, roleRoutes);
    if (discovery.length > 0) {
      recommendations.push({
        type: 'discovery',
        title: 'Discover New Features',
        description: 'Explore powerful features you haven\'t tried yet',
        routes: discovery
      });
    }

    // 4. Optimization Opportunities
    const optimization = getOptimizationOpportunities(currentPath, userRole, analytics);
    if (optimization.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Optimization Opportunities',
        description: 'Improve your efficiency with these advanced features',
        routes: optimization
      });
    }

    setRecommendations(recommendations);
  };

  const getNextLogicalSteps = (currentPath: string, userRole: string, visitedPaths: string[]): RouteSuggestion[] => {
    const suggestions: RouteSuggestion[] = [];

    // Role-specific next steps
    if (userRole === 'enterprise') {
      if (currentPath === '/dashboard') {
        suggestions.push({
          path: '/policies',
          title: 'Set Up Policies',
          category: 'governance',
          reason: 'Configure governance policies for your organization',
          priority: 'high',
          estimatedValue: '30 min setup',
          icon: <Target className="h-4 w-4" />
        });
      }
      
      if (currentPath === '/policies' && !visitedPaths.includes('/workflows')) {
        suggestions.push({
          path: '/workflows',
          title: 'Create Workflows',
          category: 'governance',
          reason: 'Automate your policy enforcement',
          priority: 'high',
          estimatedValue: 'Save 5h/week',
          icon: <Zap className="h-4 w-4" />
        });
      }
    }

    if (userRole === 'partner') {
      if (currentPath === '/agency/dashboard') {
        suggestions.push({
          path: '/agency/project-setup',
          title: 'Setup First Project',
          category: 'tools',
          reason: 'Get started with AI tool tracking',
          priority: 'high',
          estimatedValue: '15 min setup',
          icon: <Target className="h-4 w-4" />
        });
      }
    }

    return suggestions;
  };

  const getWorkflowCompletion = (currentPath: string, userRole: string, visitedPaths: string[]): RouteSuggestion[] => {
    const suggestions: RouteSuggestion[] = [];

    // Detect incomplete workflows
    if (visitedPaths.includes('/policies') && !visitedPaths.includes('/audit-trail')) {
      suggestions.push({
        path: '/audit-trail',
        title: 'Review Audit Trail',
        category: 'governance',
        reason: 'Complete your governance setup',
        priority: 'medium',
        estimatedValue: 'Compliance ready',
        icon: <Clock className="h-4 w-4" />
      });
    }

    if (userRole === 'partner' && visitedPaths.includes('/agency/project-setup') && !visitedPaths.includes('/agency/submissions')) {
      suggestions.push({
        path: '/agency/submissions',
        title: 'Submit for Review',
        category: 'workflow',
        reason: 'Complete your project submission',
        priority: 'high',
        estimatedValue: 'Get approval',
        icon: <ArrowRight className="h-4 w-4" />
      });
    }

    return suggestions;
  };

  const getFeatureDiscovery = (userRole: string, visitedPaths: string[], roleRoutes: any[]): RouteSuggestion[] => {
    const suggestions: RouteSuggestion[] = [];
    const unvisitedRoutes = roleRoutes.filter(route => !visitedPaths.includes(route.path));

    // Highlight high-value unvisited features
    const valuableFeatures = [
      { path: '/tool-intelligence', title: 'AI Tool Intelligence', value: 'Discover insights' },
      { path: '/analytics', title: 'Advanced Analytics', value: 'Data-driven decisions' },
      { path: '/marketplace-dashboard', title: 'Tool Marketplace', value: 'Find new tools' }
    ];

    valuableFeatures.forEach(feature => {
      const route = unvisitedRoutes.find(r => r.path === feature.path);
      if (route) {
        suggestions.push({
          path: route.path,
          title: feature.title,
          category: route.category,
          reason: `You haven't explored this powerful feature yet`,
          priority: 'medium',
          estimatedValue: feature.value,
          icon: <Lightbulb className="h-4 w-4" />
        });
      }
    });

    return suggestions.slice(0, 3); // Limit to top 3
  };

  const getOptimizationOpportunities = (currentPath: string, userRole: string, analytics: any[]): RouteSuggestion[] => {
    const suggestions: RouteSuggestion[] = [];

    // Suggest performance improvements based on usage patterns
    if (analytics.length > 5) {
      suggestions.push({
        path: '/analytics',
        title: 'Performance Dashboard',
        category: 'overview',
        reason: 'Optimize based on your usage patterns',
        priority: 'low',
        estimatedValue: 'Increase efficiency',
        icon: <TrendingUp className="h-4 w-4" />
      });
    }

    return suggestions;
  };

  const handleSuggestionClick = (path: string, reason: string) => {
    // Track interaction
    const interaction = {
      type: 'intelligence_suggestion_clicked',
      path,
      reason,
      fromPath: location.pathname,
      timestamp: Date.now()
    };
    
    const interactions = JSON.parse(sessionStorage.getItem('routeIntelligenceInteractions') || '[]');
    interactions.push(interaction);
    sessionStorage.setItem('routeIntelligenceInteractions', JSON.stringify(interactions));

    navigate(path);
    setIsVisible(false);
  };

  const dismissIntelligence = () => {
    setIsVisible(false);
    // Don't show again for this session
    sessionStorage.setItem('routeIntelligenceDismissed', 'true');
  };

  if (!isVisible || recommendations.length === 0) {
    return null;
  }

  // Don't show if user has dismissed for this session
  if (sessionStorage.getItem('routeIntelligenceDismissed')) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'next-step': return <ArrowRight className="h-4 w-4" />;
      case 'completion': return <Target className="h-4 w-4" />;
      case 'discovery': return <Lightbulb className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      default: return <Navigation className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Route Intelligence</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissIntelligence}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.slice(0, 2).map((rec, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center space-x-2">
                {getRecommendationIcon(rec.type)}
                <span className="text-xs font-medium">{rec.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{rec.description}</p>
              
              <div className="space-y-1">
                {rec.routes.slice(0, 2).map((route, routeIndex) => (
                  <TooltipProvider key={routeIndex}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => handleSuggestionClick(route.path, route.reason)}
                        >
                          <div className="flex items-center space-x-2 w-full">
                            {route.icon}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{route.title}</div>
                              <div className="text-xs text-muted-foreground">{route.estimatedValue}</div>
                            </div>
                            <Badge variant={getPriorityColor(route.priority)} className="text-xs">
                              {route.priority}
                            </Badge>
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{route.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ))}
          
          {recommendations.length > 2 && (
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Users className="mr-1 h-3 w-3" />
              View All Recommendations ({recommendations.length - 2} more)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteIntelligence;