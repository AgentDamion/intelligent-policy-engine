// Debug utility for navigation issues
export const navigationDebug = {
  logUserState: (user: any, profile: any, mode: string) => {
    console.group('🧭 Navigation Debug');
    console.log('User:', user);
    console.log('Profile:', profile);
    console.log('Account Type:', profile?.account_type);
    console.log('Mode:', mode);
    console.log('Current Path:', window.location.pathname);
    console.log('Demo Mode Enabled:', localStorage.getItem('demoMode') === 'true');
    console.groupEnd();
  },

  logSidebarNavigation: (mode: string, navGroups: any[], currentPath: string) => {
    console.group('📊 Sidebar Navigation Debug');
    console.log('Mode:', mode);
    console.log('Current Path:', currentPath);
    console.log('Nav Groups:', navGroups);
    console.log('Dashboard Link:', navGroups.find(g => g.items?.find((i: any) => i.name === 'Dashboard'))?.items?.find((i: any) => i.name === 'Dashboard')?.href);
    console.groupEnd();
  }
};