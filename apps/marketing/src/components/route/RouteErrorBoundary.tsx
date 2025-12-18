import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { getAllManagedRoutes } from '@/config/routes.config';
import { monitoring } from '@/utils/monitoring';

interface Props {
  children: ReactNode;
  routePath?: string;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class RouteErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    monitoring.error('Route Error Boundary', {
      error: error.message,
      stack: error.stack,
      routePath: this.props.routePath,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      const newRetryCount = this.state.retryCount + 1;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, newRetryCount - 1) * 1000;
      
      const timeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: newRetryCount
        });
      }, delay);
      
      this.retryTimeouts.push(timeout);
      
      monitoring.info('Route Error Retry', {
        routePath: this.props.routePath,
        retryCount: newRetryCount,
        delay
      });
    }
  };

  handleNavigateHome = () => {
    window.location.href = '/';
  };

  handleNavigateFallback = () => {
    const fallback = this.props.fallbackRoute || '/dashboard';
    window.location.href = fallback;
  };

  getErrorSuggestions = () => {
    const { error } = this.state;
    const suggestions: string[] = [];

    if (error?.message?.includes('ChunkLoadError')) {
      suggestions.push('This appears to be a loading issue. Please refresh the page.');
    }
    
    if (error?.message?.includes('Network')) {
      suggestions.push('Check your internet connection and try again.');
    }
    
    if (error?.stack?.includes('Suspense')) {
      suggestions.push('This component is still loading. Please wait a moment.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('An unexpected error occurred. Please try refreshing the page.');
    }
    
    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      const routes = getAllManagedRoutes();
      const currentRoute = routes.find(route => route.path === this.props.routePath);
      const suggestions = this.getErrorSuggestions();
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Something went wrong while loading this page.
                {currentRoute && (
                  <span className="block mt-1 text-sm">
                    Route: {currentRoute.title || currentRoute.path}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Suggestions:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  disabled={this.state.retryCount >= this.maxRetries}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={this.handleNavigateHome} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button onClick={this.handleNavigateFallback} variant="outline">
                  Dashboard
                </Button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-2 bg-muted rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  Debug Information
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;