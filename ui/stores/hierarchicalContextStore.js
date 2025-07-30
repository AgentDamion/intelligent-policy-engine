// File: ui/stores/hierarchicalContextStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hierarchicalContextApi } from '../services/hierarchicalContextApi';

export const useHierarchicalContextStore = create()(
  persist(
    (set, get) => ({
      // State
      user: null,
      currentContext: null,
      availableContexts: [],
      dashboardData: null,
      notifications: [],
      isLoading: false,
      error: null,
      isWebSocketConnected: false,

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await hierarchicalContextApi.login(email, password);
          
          set({ 
            user: response.user,
            currentContext: response.defaultContext,
            availableContexts: response.user.contexts,
            isLoading: false 
          });

          // Store token
          localStorage.setItem('aicomplyr_token', response.token);
          
          // Load dashboard data for current context
          get().loadDashboardData();

        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      switchContext: async (contextId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await hierarchicalContextApi.switchContext(contextId);
          
          set({ 
            currentContext: response.context,
            isLoading: false 
          });

          // Update token
          localStorage.setItem('aicomplyr_token', response.token);
          
          // Load dashboard data for new context
          get().loadDashboardData();

        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      loadDashboardData: async () => {
        const { currentContext } = get();
        if (!currentContext) return;
        
        set({ isLoading: true });
        try {
          const dashboardData = await hierarchicalContextApi.getDashboardData(
            currentContext.contextType,
            currentContext.contextType === 'enterprise' 
              ? currentContext.enterpriseId 
              : currentContext.agencySeatId
          );
          set({ dashboardData, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Enterprise management
      createEnterprise: async (enterpriseData) => {
        try {
          const enterprise = await hierarchicalContextApi.createEnterprise(enterpriseData);
          
          // Refresh contexts
          const contexts = await hierarchicalContextApi.getUserContexts();
          set({ availableContexts: contexts });
          
          return enterprise;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      createAgencySeat: async (enterpriseId, seatData) => {
        try {
          const seat = await hierarchicalContextApi.createAgencySeat(enterpriseId, seatData);
          
          // Refresh contexts
          const contexts = await hierarchicalContextApi.getUserContexts();
          set({ availableContexts: contexts });
          
          return seat;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Policy management
      assignPoliciesToSeats: async (enterpriseId, seatIds, policyIds, options) => {
        try {
          await hierarchicalContextApi.bulkAssignPolicies(enterpriseId, seatIds, policyIds, options);
          
          // Refresh dashboard data
          get().loadDashboardData();
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // User management
      inviteUserToSeat: async (enterpriseId, seatId, userData) => {
        try {
          await hierarchicalContextApi.inviteUserToSeat(enterpriseId, seatId, userData);
          
          // Refresh dashboard data
          get().loadDashboardData();
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Notifications
      loadNotifications: async () => {
        const { currentContext } = get();
        if (!currentContext) return;
        
        try {
          const notifications = await hierarchicalContextApi.getNotifications(currentContext.contextId);
          set({ notifications });
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      },

      markNotificationRead: async (notificationId) => {
        try {
          await hierarchicalContextApi.markNotificationRead(notificationId);
          
          // Update local state
          set(state => ({
            notifications: state.notifications.map(n => 
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          }));
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      // WebSocket connection
      connectWebSocket: () => {
        const { currentContext } = get();
        if (!currentContext) return;

        const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3001');
        
        ws.onopen = () => {
          set({ isWebSocketConnected: true });
          
          // Subscribe to context-specific updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            contextId: currentContext.contextId
          }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'notification':
              set(state => ({
                notifications: [data.notification, ...state.notifications]
              }));
              break;
              
            case 'dashboard_update':
              get().loadDashboardData();
              break;
              
            case 'context_switch_required':
              // Handle forced context switch
              get().switchContext(data.newContextId);
              break;
          }
        };

        ws.onclose = () => {
          set({ isWebSocketConnected: false });
          // Reconnect after 5 seconds
          setTimeout(() => get().connectWebSocket(), 5000);
        };

        return ws;
      },

      // Error handling
      clearError: () => set({ error: null }),

      // Logout
      logout: () => {
        localStorage.removeItem('aicomplyr_token');
        set({
          user: null,
          currentContext: null,
          availableContexts: [],
          dashboardData: null,
          notifications: [],
          isLoading: false,
          error: null,
          isWebSocketConnected: false
        });
      },

      // Utility functions
      getContextById: (contextId) => {
        const { availableContexts } = get();
        return availableContexts.find(ctx => ctx.contextId === contextId);
      },

      getEnterpriseContexts: () => {
        const { availableContexts } = get();
        return availableContexts.filter(ctx => ctx.contextType === 'enterprise');
      },

      getAgencySeatContexts: () => {
        const { availableContexts } = get();
        return availableContexts.filter(ctx => ctx.contextType === 'agencySeat');
      },

      hasPermission: (resource, action) => {
        const { currentContext } = get();
        if (!currentContext) return false;
        
        // Platform super admin has all permissions
        if (currentContext.role === 'platform_super_admin') return true;
        
        // Check explicit permissions
        return currentContext.permissions.some(permission => 
          permission.resource === resource && 
          permission.action === action
        );
      },

      hasRole: (roles) => {
        const { currentContext } = get();
        if (!currentContext) return false;
        
        return Array.isArray(roles) 
          ? roles.includes(currentContext.role)
          : currentContext.role === roles;
      }
    }),
    {
      name: 'hierarchical-context-store',
      partialize: (state) => ({
        user: state.user,
        currentContext: state.currentContext,
        availableContexts: state.availableContexts
      })
    }
  )
); 