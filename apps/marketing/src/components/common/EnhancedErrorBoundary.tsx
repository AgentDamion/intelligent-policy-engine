import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { monitoring } from '@/utils/monitoring';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  level?: 'page' | 'section' | 'component';
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  errorId: string;
  level?: 'page' | 'section' | 'component';
}

class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId;
    
    // Log error with context
    monitoring.error(
      `Error Boundary: ${this.props.context || 'Unknown context'}`,
      error,
      JSON.stringify({
        errorInfo,
        errorId,
        level: this.props.level,
        context: this.props.context
      })
    );

    this.setState({
      error,
      errorInfo,
      errorId
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          resetError={this.resetError}
          errorId={this.state.errorId}
          level={this.props.level}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorId,
  level = 'component'
}) => {
  const isPageLevel = level === 'page';
  const isDevMode = process.env.NODE_ENV === 'development';

  const handleReportBug = () => {
    // Open bug report with pre-filled error details
    const subject = encodeURIComponent(`Bug Report: ${error.message}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error: ${error.message}
Stack: ${error.stack}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `);
    
    window.open(`mailto:support@aicomplyr.io?subject=${subject}&body=${body}`);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (isPageLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                We apologize for the inconvenience. An unexpected error occurred.
              </p>
              <Badge variant="outline" className="font-mono text-xs">
                Error ID: {errorId}
              </Badge>
            </div>
            
            {isDevMode && (
              <details className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <summary className="cursor-pointer font-medium">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            <div className="flex space-x-2">
              <Button onClick={resetError} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleReportBug}
              className="w-full text-sm"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report This Issue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border-destructive/50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">Component Error</p>
            <p className="text-xs text-muted-foreground">
              {error.message || 'An unexpected error occurred in this component.'}
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={resetError}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
              {isDevMode && (
                <Badge variant="outline" className="font-mono text-xs">
                  {errorId}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedErrorBoundary;