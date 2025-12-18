import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Eye, UserCheck, MessageSquare } from 'lucide-react';
import { GovernanceEntity, GovernanceAlert, getSeverityEmoji } from '@/utils/governanceCalculations';
import { formatDistanceToNow } from 'date-fns';

interface OverviewTabProps {
  entities: GovernanceEntity[];
  alerts: GovernanceAlert[];
  onEntityClick: (entity: GovernanceEntity) => void;
  onAlertAction: (alertId: string, action: 'view' | 'assign' | 'snooze') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  entities,
  alerts,
  onEntityClick,
  onAlertAction
}) => {
  // Risk heatmap data - top 10 entities with lowest GHI
  const riskEntities = entities
    .sort((a, b) => a.ghi - b.ghi)
    .slice(0, 10);

  const riskDrivers = ['Compliance', 'Tool Approval', 'Audit Complete'];

  const getHeatmapColor = (entity: GovernanceEntity, driver: string): string => {
    let value: number;
    switch (driver) {
      case 'Compliance': value = entity.compliance; break;
      case 'Tool Approval': value = entity.toolApproval; break;
      case 'Audit Complete': value = entity.auditCompleteness; break;
      default: value = 50;
    }

    if (value >= 85) return 'bg-green-100 text-green-800 border-green-200';
    if (value >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getHeatmapValue = (entity: GovernanceEntity, driver: string): number => {
    switch (driver) {
      case 'Compliance': return entity.compliance;
      case 'Tool Approval': return entity.toolApproval;
      case 'Audit Complete': return entity.auditCompleteness;
      default: return 0;
    }
  };

  // Waterfall chart data (mock)
  const waterfallData = [
    { label: 'Previous Period', value: 84.3, type: 'base' },
    { label: 'Compliance +1.8', value: 1.8, type: 'positive' },
    { label: 'Tool Approval -0.6', value: -0.6, type: 'negative' },
    { label: 'Audit +1.5', value: 1.5, type: 'positive' },
    { label: 'Current Period', value: 87.0, type: 'result' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Row - Main Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Risk Drivers Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">
              Where governance risks are concentrated across entities
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Entity</th>
                    {riskDrivers.map(driver => (
                      <th key={driver} className="text-center p-2 text-sm font-medium text-muted-foreground">
                        {driver}
                      </th>
                    ))}
                    <th className="text-center p-2 text-sm font-medium text-muted-foreground">GHI</th>
                  </tr>
                </thead>
                <tbody>
                  {riskEntities.map(entity => (
                    <tr key={entity.id} className="border-t">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {entity.type}
                          </Badge>
                          <span className="text-sm font-medium truncate max-w-32">
                            {entity.name}
                          </span>
                        </div>
                      </td>
                      {riskDrivers.map(driver => (
                        <td key={driver} className="p-2 text-center">
                          <div 
                            className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${getHeatmapColor(entity, driver)}`}
                            onClick={() => onEntityClick(entity)}
                            title={`${driver}: ${getHeatmapValue(entity, driver)}%`}
                          >
                            {getHeatmapValue(entity, driver)}%
                          </div>
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        <Badge 
                          variant={entity.ghi >= 85 ? 'default' : entity.ghi >= 70 ? 'secondary' : 'destructive'}
                          className="cursor-pointer"
                          onClick={() => onEntityClick(entity)}
                        >
                          {entity.ghi}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Issues Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Issues</CardTitle>
            <p className="text-sm text-muted-foreground">
              Priority alerts requiring attention
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 6).map(alert => (
              <div key={alert.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{getSeverityEmoji(alert.severity)}</span>
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.daysOpen}d
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {alert.entity}
                  </Badge>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => onAlertAction(alert.id, 'view')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => onAlertAction(alert.id, 'assign')}
                    >
                      <UserCheck className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => onAlertAction(alert.id, 'snooze')}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Trends and Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Governance Health Changes</CardTitle>
            <p className="text-sm text-muted-foreground">
              What contributed to this period's GHI change (+3.2%)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {waterfallData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.type === 'positive' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {item.type === 'negative' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    <span className={`text-sm font-mono ${
                      item.type === 'positive' ? 'text-green-600' : 
                      item.type === 'negative' ? 'text-red-600' : 
                      'text-foreground'
                    }`}>
                      {item.type === 'positive' ? '+' : item.type === 'negative' ? '' : ''}{item.value}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">90-Day Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Governance Health vs 85% target threshold
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative h-32 border border-dashed border-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Interactive trend chart</p>
                <p className="text-xs">Would integrate with charting library</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Current: 87%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Target: 85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};