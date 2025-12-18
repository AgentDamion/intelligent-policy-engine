import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  category: string;
  actionRequired?: boolean;
  resolved?: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'MetaLoop Processing Delay',
    message: 'Enterprise customer TechCorp experiencing 45min delays in policy validation',
    timestamp: '2 minutes ago',
    category: 'System Performance',
    actionRequired: true
  },
  {
    id: '2',
    severity: 'warning',
    title: 'Partner Application Pending',
    message: 'CloudScale Inc. application requires compliance review - 3 days pending',
    timestamp: '1 hour ago',
    category: 'Partner Management',
    actionRequired: true
  },
  {
    id: '3',
    severity: 'info',
    title: 'New Enterprise Customer',
    message: 'MediTech Solutions completed onboarding - 2,450 AI tools registered',
    timestamp: '4 hours ago',
    category: 'Customer Success'
  },
  {
    id: '4',
    severity: 'warning',
    title: 'Billing Sync Warning',
    message: 'Stripe webhook delayed for 3 customer accounts - manual reconciliation needed',
    timestamp: '6 hours ago',
    category: 'Finance',
    actionRequired: true
  },
  {
    id: '5',
    severity: 'critical',
    title: 'Security Audit Required',
    message: 'FDA compliance audit scheduled for next week - documentation review needed',
    timestamp: '8 hours ago',
    category: 'Compliance',
    actionRequired: true
  }
];

export const EnhancedAlertSystem: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');

  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          emoji: '🔴',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          icon: AlertTriangle
        };
      case 'warning':
        return {
          emoji: '🟠',
          color: 'text-brand-orange',
          bgColor: 'bg-brand-orange/10',
          borderColor: 'border-brand-orange/20',
          icon: AlertCircle
        };
      case 'info':
        return {
          emoji: '🟢',
          color: 'text-brand-green',
          bgColor: 'bg-brand-green/10',
          borderColor: 'border-brand-green/20',
          icon: CheckCircle
        };
    }
  };

  const filteredAlerts = filter === 'all' 
    ? mockAlerts 
    : mockAlerts.filter(alert => alert.severity === filter);

  const displayedAlerts = expanded ? filteredAlerts : filteredAlerts.slice(0, 5);

  const criticalCount = mockAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = mockAlerts.filter(a => a.severity === 'warning').length;

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">System Alerts & Recent Activity</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-destructive border-destructive bg-destructive/10">
              {criticalCount} Critical
            </Badge>
            <Badge variant="outline" className="text-brand-orange border-brand-orange bg-brand-orange/10">
              {warningCount} Warnings
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilter(filter === 'all' ? 'critical' : 'all')}
          >
            {filter === 'all' ? 'Show Critical' : 'Show All'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm">{config.emoji}</span>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm leading-none">{alert.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {alert.actionRequired && (
                          <Badge variant="outline" className="text-xs bg-background">
                            Action Required
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className="text-xs">
                        {alert.category}
                      </Badge>
                      {alert.actionRequired && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {!expanded && filteredAlerts.length > 5 && (
          <div className="text-center pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-xs text-muted-foreground"
            >
              +{filteredAlerts.length - 5} more alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};