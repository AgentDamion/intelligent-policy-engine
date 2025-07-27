// AICOMPLYR Demo Store
// State management for demo scenarios and user sessions

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDemoData } from './demo-data-generator';

// Demo session management
export const useDemoStore = create()(
  persist(
    (set, get) => ({
      // Demo state
      demoData: createDemoData(),
      currentScenario: 'pfizer-marketing',
      demoMode: true,
      demoSession: null,
      
      // Demo user management
      demoUser: null,
      demoContext: null,
      
      // Demo interactions
      demoInteractions: [],
      demoNotifications: [],
      
      // Switch demo scenario
      switchDemoScenario: (scenarioId) => {
        const scenario = get().demoData.pharmaCompanies.find(c => c.id === scenarioId);
        if (scenario) {
          set({ 
            currentScenario: scenarioId,
            demoContext: {
              id: scenario.id,
              type: 'enterprise',
              name: scenario.name,
              role: 'enterprise_admin'
            }
          });
          
          // Log demo interaction
          get().logDemoInteraction('scenario_switch', {
            from: get().currentScenario,
            to: scenarioId,
            timestamp: new Date().toISOString()
          });
        }
      },
      
      // Generate demo session
      generateDemoSession: () => {
        const sessionId = `demo-${Date.now()}`;
        const demoUser = {
          id: sessionId,
          name: 'Demo User',
          email: 'demo@aicomplyr.io',
          role: 'enterprise_admin',
          avatar: 'https://via.placeholder.com/150',
          preferences: {
            notifications: true,
            emailAlerts: false,
            dashboardLayout: 'default'
          }
        };
        
        const demoSession = {
          sessionId,
          user: demoUser,
          startTime: Date.now(),
          scenarios: get().demoData.pharmaCompanies.map(company => ({
            id: company.id,
            type: 'enterprise',
            enterpriseName: company.name,
            role: 'enterprise_admin',
            permissions: ['read', 'write', 'admin']
          })),
          interactions: [],
          notifications: []
        };
        
        set({ 
          demoUser,
          demoSession,
          demoContext: demoSession.scenarios[0]
        });
        
        // Store in localStorage
        localStorage.setItem('aicomplyr-demo-session', JSON.stringify(demoSession));
        
        return { sessionId, user: demoUser };
      },
      
      // Log demo interactions
      logDemoInteraction: (type, data) => {
        const interaction = {
          id: `interaction-${Date.now()}`,
          type,
          data,
          timestamp: new Date().toISOString(),
          scenario: get().currentScenario
        };
        
        set(state => ({
          demoInteractions: [...state.demoInteractions, interaction]
        }));
        
        // Store in demo session
        if (get().demoSession) {
          const updatedSession = {
            ...get().demoSession,
            interactions: [...get().demoSession.interactions, interaction]
          };
          localStorage.setItem('aicomplyr-demo-session', JSON.stringify(updatedSession));
        }
      },
      
      // Add demo notification
      addDemoNotification: (notification) => {
        const demoNotification = {
          id: `demo-notif-${Date.now()}`,
          ...notification,
          timestamp: new Date().toISOString(),
          isRead: false
        };
        
        set(state => ({
          demoNotifications: [demoNotification, ...state.demoNotifications]
        }));
      },
      
      // Mark demo notification as read
      markDemoNotificationRead: (notificationId) => {
        set(state => ({
          demoNotifications: state.demoNotifications.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        }));
      },
      
      // Get demo analytics
      getDemoAnalytics: () => {
        const { demoData, currentScenario } = get();
        const scenario = demoData.pharmaCompanies.find(c => c.id === currentScenario);
        
        if (!scenario) return null;
        
        return {
          company: scenario,
          agencies: demoData.agencyScenarios.filter(agency => 
            agency.clientPartners.includes(currentScenario)
          ),
          compliance: {
            score: scenario.complianceScore,
            trend: '+3 points this month',
            riskLevel: scenario.riskLevel
          },
          submissions: {
            total: demoData.analytics.totalSubmissions,
            pending: 12,
            approved: 1150,
            rejected: 85
          },
          savings: {
            annual: '$127,000',
            monthly: '$10,583',
            breakdown: 'Admin time, incident prevention, faster approvals'
          }
        };
      },
      
      // Simulate demo activity
      simulateDemoActivity: () => {
        const activities = [
          {
            type: 'submission_created',
            title: 'New AI Content Submission',
            description: 'Ogilvy Health submitted social media campaign for review',
            timestamp: new Date().toISOString()
          },
          {
            type: 'compliance_alert',
            title: 'Potential Compliance Issue Detected',
            description: 'AI-generated content flagged for medical claim review',
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          {
            type: 'approval_completed',
            title: 'Content Approved',
            description: 'McCann Health medical education content approved',
            timestamp: new Date(Date.now() - 600000).toISOString()
          }
        ];
        
        // Add random activity
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        get().logDemoInteraction('activity', randomActivity);
        
        // Add notification for some activities
        if (randomActivity.type === 'compliance_alert') {
          get().addDemoNotification({
            type: 'warning',
            title: 'Compliance Alert',
            message: 'Potential medical claim detected in AI content',
            priority: 'high'
          });
        }
      },
      
      // Reset demo session
      resetDemoSession: () => {
        localStorage.removeItem('aicomplyr-demo-session');
        set({
          demoSession: null,
          demoUser: null,
          demoContext: null,
          demoInteractions: [],
          demoNotifications: []
        });
      },
      
      // Get demo context data
      getDemoContextData: () => {
        const { demoData, currentScenario } = get();
        const scenario = demoData.pharmaCompanies.find(c => c.id === currentScenario);
        
        if (!scenario) return null;
        
        return {
          enterprise: scenario,
          agencies: demoData.agencyScenarios.filter(agency => 
            agency.clientPartners.includes(currentScenario)
          ),
          compliance: demoData.complianceScenarios.filter(scenario => 
            scenario.agency && scenario.agency.toLowerCase().includes('health')
          ),
          users: demoData.userPersonas.filter(user => 
            user.company === scenario.name
          ),
          roi: get().demoData.generateROIMetrics(scenario)
        };
      },
      
      // Export demo data
      exportDemoData: () => {
        const { demoData, demoSession, demoInteractions } = get();
        return {
          session: demoSession,
          interactions: demoInteractions,
          analytics: demoData.analytics,
          timestamp: new Date().toISOString()
        };
      }
    }),
    {
      name: 'aicomplyr-demo-store',
      partialize: (state) => ({
        demoMode: state.demoMode,
        currentScenario: state.currentScenario,
        demoSession: state.demoSession,
        demoUser: state.demoUser
      }),
      onRehydrateStorage: () => (state) => {
        // Restore demo session from localStorage
        const storedSession = localStorage.getItem('aicomplyr-demo-session');
        if (storedSession && state) {
          try {
            const session = JSON.parse(storedSession);
            state.demoSession = session;
            state.demoUser = session.user;
            state.demoContext = session.scenarios[0];
          } catch (error) {
            console.error('Failed to restore demo session:', error);
          }
        }
      }
    }
  )
);

// Demo API service for realistic interactions
export const demoApiService = {
  // Simulate API calls with demo data
  async getDemoData(endpoint, params = {}) {
    const { demoData } = useDemoStore.getState();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    switch (endpoint) {
      case '/user/contexts':
        return demoData.pharmaCompanies.map(company => ({
          id: company.id,
          name: company.name,
          type: 'enterprise',
          isDefault: company.id === 'pfizer-marketing',
          permissions: ['read', 'write', 'admin'],
          lastAccessed: new Date().toISOString()
        }));
        
      case '/dashboard/enterprise/pfizer-marketing':
        return {
          metrics: {
            compliance: 94,
            violations: 0,
            pendingReviews: 5,
            completedToday: 12
          },
          recentActivity: demoData.recentActivity,
          alerts: demoData.notifications.filter(n => n.priority === 'high')
        };
        
      case '/enterprise/pfizer-marketing/seats':
        return {
          enterpriseId: 'pfizer-marketing',
          seats: demoData.agencyScenarios.map(agency => ({
            id: agency.id,
            name: agency.name,
            adminName: agency.teamMembers[0]?.name || 'Agency Admin',
            status: 'active',
            activeUsers: agency.teamSize,
            userLimit: agency.teamSize + 5,
            complianceScore: agency.complianceScore,
            lastActivity: '2 hours ago',
            assignedPolicies: 5,
            createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
          })),
          totalSeats: demoData.agencyScenarios.length,
          activeSeats: demoData.agencyScenarios.length,
          pendingSeats: 0
        };
        
      case '/notifications/pfizer-marketing':
        return demoData.notifications;
        
      case '/user/profile':
        return {
          id: 'demo-user-001',
          name: 'Demo User',
          email: 'demo@aicomplyr.io',
          role: 'Enterprise Administrator',
          avatar: 'https://via.placeholder.com/150',
          preferences: {
            notifications: true,
            emailAlerts: false,
            dashboardLayout: 'default'
          },
          lastLogin: new Date().toISOString()
        };
        
      default:
        throw new Error(`Demo endpoint not found: ${endpoint}`);
    }
  },
  
  // Simulate real-time updates
  startDemoUpdates() {
    const interval = setInterval(() => {
      const store = useDemoStore.getState();
      
      // Simulate random activity
      if (Math.random() < 0.3) { // 30% chance
        store.simulateDemoActivity();
      }
      
      // Add demo notifications occasionally
      if (Math.random() < 0.1) { // 10% chance
        const notifications = [
          {
            type: 'info',
            title: 'System Update',
            message: 'New AI policy templates available',
            priority: 'low'
          },
          {
            type: 'success',
            title: 'Compliance Score Improved',
            message: 'Your compliance score increased by 2 points',
            priority: 'medium'
          }
        ];
        
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        store.addDemoNotification(randomNotification);
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }
};

// Demo utilities
export const demoUtils = {
  // Generate realistic demo content
  generateDemoContent: (type) => {
    const contentTemplates = {
      'social-media': {
        title: 'AI-Generated Social Media Campaign',
        description: 'Compliance-approved social media content for product launch',
        content: 'Discover how our innovative treatment is helping patients...',
        aiTools: ['ChatGPT', 'Midjourney'],
        complianceScore: 92
      },
      'medical-education': {
        title: 'Medical Education Materials',
        description: 'AI-assisted medical education content for healthcare professionals',
        content: 'Clinical data shows significant improvement in patient outcomes...',
        aiTools: ['Claude', 'Grammarly'],
        complianceScore: 95
      },
      'digital-campaign': {
        title: 'Digital Marketing Campaign',
        description: 'AI-powered digital campaign for patient awareness',
        content: 'Learn about the latest treatment options available...',
        aiTools: ['ChatGPT', 'Figma AI'],
        complianceScore: 88
      }
    };
    
    return contentTemplates[type] || contentTemplates['social-media'];
  },
  
  // Format demo metrics
  formatDemoMetrics: (metrics) => {
    return {
      ...metrics,
      formatted: {
        complianceScore: `${metrics.complianceScore}%`,
        timeToApproval: `${metrics.timeToApproval} days`,
        costSavings: `$${metrics.costSavings.toLocaleString()}`,
        riskReduction: `${metrics.riskReduction}%`
      }
    };
  }
}; 