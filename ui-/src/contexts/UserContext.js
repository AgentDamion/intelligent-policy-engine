import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('enterprise');
  const [workflow, setWorkflow] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);

  useEffect(() => {
    // Initialize user context
    const initializeUser = async () => {
      try {
        // Mock user data - in real app, this would come from Auth0 or similar
        const mockUser = {
          id: 'user_123',
          email: 'admin@aicomplyr.io',
          name: 'Enterprise Admin',
          role: 'enterprise',
          permissions: [
            'audit:read',
            'policy:write',
            'user:read',
            'org:read',
            'system:admin',
            'review_overrides',
            'agency:invite',
            'policy:read'
          ],
          organizations: [
            {
              id: 'org_456',
              name: 'PharmaCorp Inc.',
              type: 'enterprise',
              role: 'admin'
            }
          ]
        };

        setUser(mockUser);
        setRole(mockUser.role);
        setPermissions(mockUser.permissions);
        setOrganizations(mockUser.organizations);
        setCurrentOrganization(mockUser.organizations[0]);

        console.log('👤 User context initialized:', mockUser);
      } catch (error) {
        console.error('❌ Error initializing user context:', error);
      }
    };

    initializeUser();
  }, []);

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasRole = (userRole) => {
    return role === userRole;
  };

  const switchOrganization = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      console.log(`🏢 Switched to organization: ${org.name}`);
    }
  };

  const updateWorkflow = (workflowData) => {
    setWorkflow(workflowData);
    console.log('🔄 Workflow updated:', workflowData);
  };

  const clearWorkflow = () => {
    setWorkflow(null);
    console.log('🔄 Workflow cleared');
  };

  const value = {
    user,
    role,
    setRole,
    workflow,
    setWorkflow: updateWorkflow,
    clearWorkflow,
    permissions,
    organizations,
    currentOrganization,
    switchOrganization,
    hasPermission,
    hasRole
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext }; 