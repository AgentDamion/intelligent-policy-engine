import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Bot, TrendingUp, Users, Building, Eye } from 'lucide-react';

interface ToolRiskData {
  id: string;
  toolName: string;
  vendor: string;
  category: string;
  riskScore: number;
  usageCount: number;
  lastUsed: string;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
  users: number;
  departments: string[];
  violations: number;
}

interface DashboardData {
  overallRiskScore: number;
  totalTools: number;
  compliantTools: number;
  activeUsers: number;
  recentViolations: number;
  tools: ToolRiskData[];
}

export const AIToolRiskDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading real dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData: DashboardData = {
        overallRiskScore: 76,
        totalTools: 23,
        compliantTools: 18,
        activeUsers: 147,
        recentViolations: 3,
        tools: [
          {
            id: '1',
            toolName: 'ChatGPT Enterprise',
            vendor: 'OpenAI',
            category: 'Large Language Model',
            riskScore: 85,
            usageCount: 342,
            lastUsed: '2 minutes ago',
            complianceStatus: 'compliant',
            users: 45,
            departments: ['Clinical Research', 'Medical Affairs', 'Regulatory'],
            violations: 0
          },
          {
            id: '2',
            toolName: 'Claude 3.5 Sonnet',
            vendor: 'Anthropic',
            category: 'Large Language Model',
            riskScore: 88,
            usageCount: 156,
            lastUsed: '8 minutes ago',
            complianceStatus: 'compliant',
            users: 28,
            departments: ['Medical Writing', 'Clinical Research'],
            violations: 0
          },
          {
            id: '3',
            toolName: 'Midjourney',
            vendor: 'Midjourney Inc.',
            category: 'Image Generation',
            riskScore: 45,
            usageCount: 89,
            lastUsed: '1 hour ago',
            complianceStatus: 'at_risk',
            users: 12,
            departments: ['Marketing', 'Digital Health'],
            violations: 2
          },
          {
            id: '4',
            toolName: 'Custom GPT Model',
            vendor: 'Unknown',
            category: 'Large Language Model',
            riskScore: 15,
            usageCount: 23,
            lastUsed: '3 hours ago',
            complianceStatus: 'non_compliant',
            users: 8,
            departments: ['Research'],
            violations: 5
          },
          {
            id: '5',
            toolName: 'GitHub Copilot',
            vendor: 'Microsoft',
            category: 'Code Generation',
            riskScore: 72,
            usageCount: 445,
            lastUsed: '5 minutes ago',
            complianceStatus: 'compliant',
            users: 35,
            departments: ['IT', 'Data Science', 'Digital Innovation'],
            violations: 1
          }
        ]
      };
      
      setDashboardData(mockData);
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'at_risk':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'at_risk':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'non_compliant':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary animate-pulse" />
            <span>Loading AI Tool Risk Dashboard...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>AI Tool Risk Dashboard</span>
            </div>
            <Badge variant="secondary">
              Live Portfolio Monitoring
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 bg-primary/5 rounded-lg"
            >
              <div className={`text-2xl font-bold ${getRiskScoreColor(dashboardData.overallRiskScore)}`}>
                {dashboardData.overallRiskScore}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Risk Score</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 bg-blue-50 rounded-lg"
            >
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.totalTools}
              </div>
              <div className="text-sm text-muted-foreground">Total AI Tools</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4 bg-green-50 rounded-lg"
            >
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.compliantTools}
              </div>
              <div className="text-sm text-muted-foreground">Compliant Tools</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 bg-purple-50 rounded-lg"
            >
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.activeUsers}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-4 bg-red-50 rounded-lg"
            >
              <div className="text-2xl font-bold text-red-600">
                {dashboardData.recentViolations}
              </div>
              <div className="text-sm text-muted-foreground">Recent Violations</div>
            </motion.div>
          </div>

          {/* Tools List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">AI Tool Portfolio</h3>
            {dashboardData.tools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Bot className="w-8 h-8 text-primary" />
                        <div>
                          <div className="font-medium">{tool.toolName}</div>
                          <div className="text-sm text-muted-foreground">
                            by {tool.vendor} • {tool.category}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* Risk Score */}
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getRiskScoreColor(tool.riskScore)}`}>
                            {tool.riskScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">Risk Score</div>
                        </div>

                        {/* Usage Stats */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {tool.usageCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Uses</div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(tool.complianceStatus)}
                          <Badge className={getStatusColor(tool.complianceStatus)}>
                            {tool.complianceStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Last Used</div>
                        <div className="font-medium">{tool.lastUsed}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Active Users</div>
                        <div className="font-medium">{tool.users} users</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Departments</div>
                        <div className="font-medium">{tool.departments.slice(0, 2).join(', ')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Violations</div>
                        <div className={`font-medium ${tool.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {tool.violations} violations
                        </div>
                      </div>
                    </div>

                    {tool.violations > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-900">
                            Recent Policy Violations Detected
                          </span>
                        </div>
                        <div className="text-xs text-red-700 mt-1">
                          Usage outside approved parameters • Requires immediate review
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium text-primary">Live AI Tool Portfolio Monitoring</div>
            <div className="text-sm text-muted-foreground mt-1">
              This dashboard shows real-time monitoring of your AI tool portfolio with risk assessment, 
              usage analytics, and compliance status. In production, this integrates with your security 
              systems for automated threat detection and policy enforcement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};