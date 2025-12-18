import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
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
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Log to console in development
    console.error('Global Error Boundary caught an error:', errorData);

    // In production, send to monitoring service (e.g., Sentry)
    if (import.meta.env.PROD) {
      // TODO: Integrate with monitoring service
      // Example: Sentry.captureException(error, { extra: errorData });
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertTitle>Application Error</AlertTitle>
                <AlertDescription>
                  An unexpected error occurred. Our team has been notified.
                </AlertDescription>
              </Alert>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <div className="text-sm font-mono">
                      <div className="font-semibold text-destructive mb-2">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="mt-4 whitespace-pre-wrap text-xs text-muted-foreground">
                          Component Stack:
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </div>
                </details>
              )}

              <div className="flex space-x-3">
                <Button onClick={this.handleRetry} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Error ID: <code className="bg-muted px-1 py-0.5 rounded">{this.state.errorId}</code>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}