import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeclareAssetInput {
  fileHash: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  projectId: string;
  workspaceId: string;
  toolsUsed: string[];
  usageDescription: string;
}

export function useDeclareAsset(options?: { onSuccess?: (data: any) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeclareAssetInput) => {
      const { data, error } = await supabase.functions.invoke('cursor-agent-adapter', {
        body: {
          agent: 'asset-declaration',
          action: 'declare_asset',
          payload: {
            file_hash: input.fileHash,
            file_name: input.fileName,
            file_size_bytes: input.fileSize,
            file_type: input.fileType,
            project_id: input.projectId,
            workspace_id: input.workspaceId,
            tools_used: input.toolsUsed,
            usage_description: input.usageDescription,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asset-declarations'] });
      toast({
        title: 'Declaration Submitted',
        description: 'Your asset has been registered successfully',
      });
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      toast({
        title: 'Declaration Failed',
        description: error.message || 'Failed to submit asset declaration',
        variant: 'destructive',
      });
    },
  });
}
