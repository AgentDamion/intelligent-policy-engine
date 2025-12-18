import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Shield,
  TrendingUp
} from 'lucide-react';
import type { ClientCompliance } from '@/hooks/useClientComplianceData';

interface ClientComplianceCardProps {
  client: ClientCompliance;
  onViewDetails?: (clientId: string) => void;
}

export const ClientComplianceCard: React.FC<ClientComplianceCardProps> = ({ 
  client, 
  onViewDetails 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-600';
      case 'warning':
        return 'bg-yellow-600';
      case 'critical':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${getStatusColor(client.overallStatus)} border-l-4`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(client.overallStatus)}
              <div>
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {client.overallScore}% Compliant
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last audit: {formatDate(client.lastAudit)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Compliance</span>
                <span className="font-medium">{client.overallScore}%</span>
              </div>
              <Progress 
                value={client.overallScore} 
                className="h-2"
                style={{
                  '--tw-progress-background': getProgressColor(client.overallStatus)
                } as React.CSSProperties}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Next audit: {formatDate(client.nextAudit)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{client.actionItems.length} action items</span>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-4 border-t"
              >
                {/* Compliance Areas */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Compliance Areas</h4>
                  <div className="space-y-2">
                    {client.complianceAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(area.status)}
                          <span>{area.name}</span>
                        </div>
                        <span className="font-medium">{area.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* High Priority Actions */}
                {client.actionItems.filter(item => item.priority === 'high').length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-700">High Priority Actions</h4>
                    <div className="space-y-1">
                      {client.actionItems
                        .filter(item => item.priority === 'high')
                        .map((item) => (
                          <div key={item.id} className="text-xs text-red-600">
                            • {item.title} (Due: {formatDate(item.dueDate)})
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onViewDetails?.(client.id)}
                >
                  View Full Details
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};