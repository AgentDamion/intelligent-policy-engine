import { create } from 'zustand';

const useUserContext = create((set) => ({
  // User role state
  userRole: null, // e.g., 'pharma' | 'agency' | 'innovation'
  
  // User name state
  userName: null, // e.g., 'John Doe' | 'Sarah Smith'
  
  // Actions
  setUserRole: (role) => set({ userRole: role }),
  setUserName: (name) => set({ userName: name }),
  
  // Reset functions
  resetUserRole: () => set({ userRole: null }),
  resetUserName: () => set({ userName: null }),
  resetAll: () => set({ userRole: null, userName: null }),
}));

export default useUserContext; 