import { useState, useEffect } from 'react';
import { getRoleArchetypes, DEFAULT_ROLE_ARCHETYPES, type RoleArchetype } from '@/services/workflow/roleArchetypeService';

export function useRoleArchetypes() {
  const [archetypes, setArchetypes] = useState<RoleArchetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchArchetypes() {
      try {
        setLoading(true);
        const { data, error } = await getRoleArchetypes();
        
        if (error) {
          // Fallback to defaults if database query fails
          const defaultArchetypes = Object.entries(DEFAULT_ROLE_ARCHETYPES).map(([id, info]) => ({
            id,
            name: info.name,
            icon: info.icon,
            color: info.color,
            display_order: 100,
          }));
          setArchetypes(defaultArchetypes);
        } else {
          setArchetypes(data || []);
        }
        setError(null);
      } catch (err) {
        // Fallback to defaults on error
        const defaultArchetypes = Object.entries(DEFAULT_ROLE_ARCHETYPES).map(([id, info]) => ({
          id,
          name: info.name,
          icon: info.icon,
          color: info.color,
          display_order: 100,
        }));
        setArchetypes(defaultArchetypes);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchArchetypes();
  }, []);

  return { archetypes, loading, error };
}

