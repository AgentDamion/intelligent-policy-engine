import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGovernanceData } from '@/hooks/useGovernanceData';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { metrics, entities, loading } = useGovernanceData({
    timeRange,
    segment: 'all',
    riskTiers: [],
    statuses: [],
    search: ''
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Governance Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights and metrics for governance performance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={timeRange === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </Button>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Overall Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.governanceHealth}%</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Avg Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.compliance}%</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+3% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.openRisks}</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 rotate-180" />
              <span>-2 from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Avg Review Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.5d</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 rotate-180" />
              <span>-0.5d from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Distribution</CardTitle>
            <CardDescription>Breakdown by compliance score</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-8 bg-muted rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Excellent (90-100%)</span>
                    <Badge variant="default">
                      {entities.filter(e => e.compliance >= 90).length}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(entities.filter(e => e.compliance >= 90).length / entities.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Good (70-89%)</span>
                    <Badge variant="secondary">
                      {entities.filter(e => e.compliance >= 70 && e.compliance < 90).length}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(entities.filter(e => e.compliance >= 70 && e.compliance < 90).length / entities.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Needs Attention (&lt;70%)</span>
                    <Badge variant="destructive">
                      {entities.filter(e => e.compliance < 70).length}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(entities.filter(e => e.compliance < 70).length / entities.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Breakdown by risk tier</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse h-8 bg-muted rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {['high', 'medium', 'low'].map((tier) => {
                  const thresholds = { high: 10, medium: 5, low: 3 };
                  const count = entities.filter(e => e.openRisks >= thresholds[tier as keyof typeof thresholds]).length;
                  const percentage = entities.length > 0 ? (count / entities.length) * 100 : 0;
                  const color = tier === 'high' ? 'bg-red-600' 
                    : tier === 'medium' ? 'bg-amber-600' : 'bg-green-600';
                  
                  return (
                    <div key={tier}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{tier}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest governance events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 border rounded">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Activity tracking coming soon</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
