import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';
import { monitoring } from '@/utils/monitoring';

interface Props {
  children: ReactNode;
  dashboardType?: 'enterprise' | 'agency';
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring system
    monitoring.error(
      `Dashboard Error in ${this.props.dashboardType || 'unknown'} dashboard`,
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo,
        dashboardType: this.props.dashboardType,
        errorId: this.state.errorId
      },
      'dashboard'
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      // Create error report
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error.message,
        stack: this.state.error.stack,
        dashboardType: this.props.dashboardType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Copy to clipboard for user to share
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      console.log('Error report copied to clipboard:', errorReport);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  <AlertTriangle className="h-6 w-6 text-destructive absolute -top-1 -right-1" />
                </div>
              </div>
              <CardTitle className="text-destructive">
                {this.props.dashboardType === 'agency' ? 'Agency' : 'Enterprise'} Dashboard Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground">
                  We encountered an error while loading the dashboard. This has been automatically reported to our monitoring system.
                </p>
                {this.state.errorId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Error ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{this.state.errorId}</code>
                  </p>
                )}
              </div>

              {this.state.error && (
                <details className="text-left p-4 bg-muted rounded-md">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <pre className="mt-2 text-sm overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Dashboard
                </Button>
                <Button onClick={this.handleReportError} variant="ghost" size="sm">
                  Copy Error Report
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>If this problem persists, please contact support with the error ID above.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;