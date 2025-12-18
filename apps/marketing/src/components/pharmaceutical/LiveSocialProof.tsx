import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users, Download, Calendar, MapPin, Building2, X, Zap } from 'lucide-react';
import { unifiedApi } from '@/services/unified-api';

interface LiveActivity {
  id: string;
  type: 'demo_request' | 'assessment_complete' | 'document_processed' | 'report_download' | 'meeting_scheduled';
  message: string;
  company?: string;
  location?: string;
  timestamp: Date;
  metadata?: any;
}

export const LiveSocialProof: React.FC = () => {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<LiveActivity[]>([]);
  const [stats, setStats] = useState({
    activeUsers: 0,
    completedAssessments: 0,
    processedDocuments: 0,
    scheduledDemos: 0
  });

  useEffect(() => {
    loadInitialActivities();
    startLiveUpdates();
  }, []);

  const loadInitialActivities = async () => {
    try {
      // In a real implementation, this would fetch from the unified API
      const mockActivities: LiveActivity[] = [
        {
          id: '1',
          type: 'demo_request',
          message: 'Pfizer team just requested an executive demo',
          company: 'Pfizer Inc.',
          location: 'New York, NY',
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          id: '2',
          type: 'assessment_complete',
          message: 'Johnson & Johnson completed their AI readiness assessment',
          company: 'Johnson & Johnson',
          location: 'New Brunswick, NJ',
          timestamp: new Date(Date.now() - 12 * 60 * 1000)
        },
        {
          id: '3',
          type: 'document_processed',
          message: 'Novartis processed 15 clinical documents for compliance',
          company: 'Novartis',
          location: 'Basel, Switzerland',
          timestamp: new Date(Date.now() - 18 * 60 * 1000)
        },
        {
          id: '4',
          type: 'report_download',
          message: 'Roche downloaded FDA compliance benchmark report',
          company: 'Roche',
          location: 'Basel, Switzerland',
          timestamp: new Date(Date.now() - 25 * 60 * 1000)
        },
        {
          id: '5',
          type: 'meeting_scheduled',
          message: 'Merck scheduled technical deep dive for next week',
          company: 'Merck & Co.',
          location: 'Kenilworth, NJ',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        }
      ];

      setActivities(mockActivities);
      
      // Load real-time stats
      const mockStats = {
        activeUsers: 47,
        completedAssessments: 1247,
        processedDocuments: 8329,
        scheduledDemos: 89
      };
      setStats(mockStats);

    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const startLiveUpdates = () => {
    const interval = setInterval(() => {
      generateNewActivity();
      updateStats();
    }, 15000 + Math.random() * 20000); // Random interval between 15-35 seconds

    return () => clearInterval(interval);
  };

  const generateNewActivity = () => {
    const companies = [
      { name: 'Bristol Myers Squibb', location: 'New York, NY' },
      { name: 'AbbVie', location: 'North Chicago, IL' },
      { name: 'Amgen', location: 'Thousand Oaks, CA' },
      { name: 'Genentech', location: 'South San Francisco, CA' },
      { name: 'Gilead Sciences', location: 'Foster City, CA' },
      { name: 'Biogen', location: 'Cambridge, MA' },
      { name: 'Regeneron', location: 'Tarrytown, NY' },
      { name: 'Moderna', location: 'Cambridge, MA' }
    ];

    const activityTypes = [
      {
        type: 'demo_request' as const,
        templates: [
          'just requested an executive demo',
          'scheduled a platform demonstration',
          'requested a technical deep dive'
        ]
      },
      {
        type: 'assessment_complete' as const,
        templates: [
          'completed their AI readiness assessment',
          'finished compliance maturity evaluation',
          'submitted their governance assessment'
        ]
      },
      {
        type: 'document_processed' as const,
        templates: [
          `processed ${Math.floor(Math.random() * 20) + 5} clinical documents`,
          `analyzed ${Math.floor(Math.random() * 15) + 8} regulatory submissions`,
          `validated ${Math.floor(Math.random() * 12) + 10} AI compliance reports`
        ]
      },
      {
        type: 'report_download' as const,
        templates: [
          'downloaded FDA compliance guide',
          'accessed benchmark report',
          'retrieved regulatory framework documentation'
        ]
      }
    ];

    const company = companies[Math.floor(Math.random() * companies.length)];
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const template = activityType.templates[Math.floor(Math.random() * activityType.templates.length)];

    const newActivity: LiveActivity = {
      id: Date.now().toString(),
      type: activityType.type,
      message: `${company.name} ${template}`,
      company: company.name,
      location: company.location,
      timestamp: new Date()
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20 activities
    showNotification(newActivity);
  };

  const showNotification = (activity: LiveActivity) => {
    setVisibleNotifications(prev => [...prev, activity]);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      setVisibleNotifications(prev => prev.filter(n => n.id !== activity.id));
    }, 8000);
  };

  const updateStats = () => {
    setStats(prev => ({
      activeUsers: prev.activeUsers + Math.floor(Math.random() * 3),
      completedAssessments: prev.completedAssessments + Math.floor(Math.random() * 2),
      processedDocuments: prev.processedDocuments + Math.floor(Math.random() * 5) + 1,
      scheduledDemos: prev.scheduledDemos + (Math.random() < 0.3 ? 1 : 0)
    }));
  };

  const dismissNotification = (id: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getActivityIcon = (type: LiveActivity['type']) => {
    switch (type) {
      case 'demo_request':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'assessment_complete':
        return <Eye className="w-4 h-4 text-green-600" />;
      case 'document_processed':
        return <Zap className="w-4 h-4 text-purple-600" />;
      case 'report_download':
        return <Download className="w-4 h-4 text-orange-600" />;
      case 'meeting_scheduled':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getActivityColor = (type: LiveActivity['type']) => {
    switch (type) {
      case 'demo_request':
        return 'border-blue-200 bg-blue-50';
      case 'assessment_complete':
        return 'border-green-200 bg-green-50';
      case 'document_processed':
        return 'border-purple-200 bg-purple-50';
      case 'report_download':
        return 'border-orange-200 bg-orange-50';
      case 'meeting_scheduled':
        return 'border-indigo-200 bg-indigo-50';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Activity Dashboard</h3>
            <Badge variant="secondary" className="pulse">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <motion.div
                key={stats.activeUsers}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-blue-600"
              >
                {stats.activeUsers}
              </motion.div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            
            <div className="text-center">
              <motion.div
                key={stats.completedAssessments}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-green-600"
              >
                {stats.completedAssessments.toLocaleString()}
              </motion.div>
              <div className="text-sm text-muted-foreground">Assessments</div>
            </div>
            
            <div className="text-center">
              <motion.div
                key={stats.processedDocuments}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-purple-600"
              >
                {stats.processedDocuments.toLocaleString()}
              </motion.div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </div>
            
            <div className="text-center">
              <motion.div
                key={stats.scheduledDemos}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-indigo-600"
              >
                {stats.scheduledDemos}
              </motion.div>
              <div className="text-sm text-muted-foreground">Demos Scheduled</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Industry Activity</h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.slice(0, 8).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.message}</div>
                  {activity.location && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{activity.location}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Floating Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {visibleNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`p-4 rounded-lg border shadow-lg ${getActivityColor(notification.type)} backdrop-blur-sm`}
            >
              <div className="flex items-start justify-between space-x-2">
                <div className="flex items-start space-x-2">
                  {getActivityIcon(notification.type)}
                  <div>
                    <div className="text-sm font-medium">{notification.message}</div>
                    {notification.location && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{notification.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};