import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useToolRegistry() {
  return useQuery({
    queryKey: ['ai-tool-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tool_registry')
        .select('*')
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}
