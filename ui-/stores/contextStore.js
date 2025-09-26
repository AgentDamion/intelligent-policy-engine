import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { contextApi, wsService } from '../services/contextApi';

export const useContextStore = create()(
  persist(
    (set, get) => ({
      // State
      currentContext: null,
      availableContexts: [],
      dashboardData: null,
      notifications: [],
      userProfile: null,
      isLoading: false,
      error: null,
      isWebSocketConnected: false,

      // Actions
      loadUserContexts: async () => {
        set({ isLoading: true, error: null });
        try {
          const contexts = await contextApi.getUserContexts();
          const currentContext = contexts.find(c => c.isDefault) || contexts[0];
          
          set({ 
            availableContexts: contexts,
            currentContext,
            isLoading: false 
          });

          // Load dashboard data for current context
          if (currentContext) {
            get().loadDashboardData();
          }

          // Connect WebSocket for real-time updates
          const token = localStorage.getItem('aicomplyr_token');
          if (token) {
            wsService.connect(token);
            set({ isWebSocketConnected: true });
          }

        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      switchContext: async (contextId) => {
        set({ isLoading: true, error: null });
        try {
          const newContext = await contextApi.switchContext(contextId);
          const dashboardData = await contextApi.getDashboardData(
            newContext.type, 
            newContext.id
          );
          
          set({ 
            currentContext: newContext,
            dashboardData,
            isLoading: false 
          });

          // Load notifications for new context
          get().loadNotifications();

        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      loadDashboardData: async () => {
        const { currentContext } = get();
        if (!currentContext) return;
        
        set({ isLoading: true });
        try {
          const dashboardData = await contextApi.getDashboardData(
            currentContext.type,
            currentContext.id
          );
          set({ dashboardData, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      loadNotifications: async (filter = 'all') => {
        const { currentContext } = get();
        if (!currentContext) return;

        try {
          const notifications = await contextApi.getNotifications(currentContext.id, filter);
          set({ notifications });
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      },

      loadUserProfile: async () => {
        try {
          const userProfile = await contextApi.getUserProfile();
          set({ userProfile });
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      },

      markNotificationRead: async (notificationId) => {
        try {
          await contextApi.markNotificationRead(notificationId);
          set(state => ({
            notifications: state.notifications.map(n => 
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          }));
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      markAllNotificationsRead: async () => {
        const { currentContext } = get();
        if (!currentContext) return;

        try {
          await contextApi.markAllNotificationsRead(currentContext.id);
          set(state => ({
            notifications: state.notifications.map(n => ({ ...n, isRead: true }))
          }));
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
        }
      },

      loadUserProfile: async () => {
        try {
          const profile = await contextApi.getUserProfile();
          set({ userProfile: profile });
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      },

      updateUserProfile: async (profileData) => {
        try {
          const updatedProfile = await contextApi.updateUserProfile(profileData);
          set({ userProfile: updatedProfile });
        } catch (error) {
          set({ error: error.message });
        }
      },

      // WebSocket real-time updates
      handleWebSocketMessage: (type, payload) => {
        switch (type) {
          case 'notification':
            set(state => ({
              notifications: [payload, ...state.notifications]
            }));
            break;
          
          case 'dashboard_update':
            set({ dashboardData: payload });
            break;
          
          case 'context_update':
            set(state => ({
              availableContexts: state.availableContexts.map(ctx => 
                ctx.id === payload.id ? { ...ctx, ...payload } : ctx
              ),
              currentContext: state.currentContext?.id === payload.id 
                ? { ...state.currentContext, ...payload }
                : state.currentContext
            }));
            break;
          
          case 'compliance_alert':
            // Handle compliance alerts
            console.log('Compliance alert received:', payload);
            break;
          
          default:
            console.log('Unknown WebSocket message type:', type, payload);
        }
      },

      // Error handling
      clearError: () => {
        set({ error: null });
      },

      // WebSocket connection management
      setWebSocketConnected: (connected) => {
        set({ isWebSocketConnected: connected });
      },

      disconnectWebSocket: () => {
        wsService.disconnect();
        set({ isWebSocketConnected: false });
      },

      // Utility actions
      getContextById: (contextId) => {
        const { availableContexts } = get();
        return availableContexts.find(ctx => ctx.id === contextId);
      },

      getUnreadNotificationCount: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.isRead).length;
      },

      getNotificationsByContext: (contextId) => {
        const { notifications } = get();
        return notifications.filter(n => n.contextId === contextId);
      },

      // Refresh all data
      refreshAll: async () => {
        const { currentContext } = get();
        if (currentContext) {
          await Promise.all([
            get().loadDashboardData(),
            get().loadNotifications(),
            get().loadUserProfile()
          ]);
        }
      },

      // Reset store (for logout)
      reset: () => {
        set({
          currentContext: null,
          availableContexts: [],
          dashboardData: null,
          notifications: [],
          userProfile: null,
          isLoading: false,
          error: null,
          isWebSocketConnected: false
        });
        wsService.disconnect();
      }
    }),
    {
      name: 'aicomplyr-context-store',
      partialize: (state) => ({ 
        currentContext: state.currentContext,
        userProfile: state.userProfile
      }),
      onRehydrateStorage: () => (state) => {
        // Reconnect WebSocket after rehydration
        if (state && state.currentContext) {
          const token = localStorage.getItem('aicomplyr_token');
          if (token) {
            wsService.connect(token);
            state.setWebSocketConnected(true);
          }
        }
      }
    }
  )
);

// Subscribe to WebSocket messages
wsService.subscribe('notification', (payload) => {
  useContextStore.getState().handleWebSocketMessage('notification', payload);
});

wsService.subscribe('dashboard_update', (payload) => {
  useContextStore.getState().handleWebSocketMessage('dashboard_update', payload);
});

wsService.subscribe('context_update', (payload) => {
  useContextStore.getState().handleWebSocketMessage('context_update', payload);
});

wsService.subscribe('compliance_alert', (payload) => {
  useContextStore.getState().handleWebSocketMessage('compliance_alert', payload);
}); 