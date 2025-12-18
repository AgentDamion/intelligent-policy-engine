import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformIntegrationsApi, CreatePlatformConfigInput, UpdatePlatformConfigInput } from '@/services/platform-integrations-api';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEYS = {
  configurations: ['platform-configurations'],
  logs: ['platform-integration-logs'],
  configLogs: (configId: string) => ['platform-integration-logs', configId],
};

export const usePlatformIntegrations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all platform configurations
  const {
    data: configurations = [],
    isLoading: isLoadingConfigurations,
    error: configurationsError,
  } = useQuery({
    queryKey: QUERY_KEYS.configurations,
    queryFn: () => platformIntegrationsApi.listConfigurations(),
  });

  // Fetch all integration logs
  const {
    data: logs = [],
    isLoading: isLoadingLogs,
  } = useQuery({
    queryKey: QUERY_KEYS.logs,
    queryFn: () => platformIntegrationsApi.getIntegrationLogs(100),
  });

  // Create platform configuration
  const createConfiguration = useMutation({
    mutationFn: (input: CreatePlatformConfigInput) =>
      platformIntegrationsApi.createConfiguration(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configurations });
      toast({
        title: 'Success',
        description: 'Platform integration created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create platform integration',
        variant: 'destructive',
      });
    },
  });

  // Update platform configuration
  const updateConfiguration = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlatformConfigInput }) =>
      platformIntegrationsApi.updateConfiguration(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configurations });
      toast({
        title: 'Success',
        description: 'Platform integration updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update platform integration',
        variant: 'destructive',
      });
    },
  });

  // Delete platform configuration
  const deleteConfiguration = useMutation({
    mutationFn: (id: string) => platformIntegrationsApi.deleteConfiguration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configurations });
      toast({
        title: 'Success',
        description: 'Platform integration deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete platform integration',
        variant: 'destructive',
      });
    },
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: (id: string) => platformIntegrationsApi.testConnection(id),
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Success' : 'Failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to test connection',
        variant: 'destructive',
      });
    },
  });

  // Trigger sync
  const triggerSync = useMutation({
    mutationFn: ({ id, platformType }: { id: string; platformType: string }) =>
      platformIntegrationsApi.triggerSync(id, platformType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
      toast({
        title: 'Success',
        description: 'Sync triggered successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger sync',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    configurations,
    logs,
    isLoadingConfigurations,
    isLoadingLogs,
    configurationsError,

    // Mutations
    createConfiguration: createConfiguration.mutate,
    updateConfiguration: updateConfiguration.mutate,
    deleteConfiguration: deleteConfiguration.mutate,
    testConnection: testConnection.mutate,
    triggerSync: triggerSync.mutate,

    // Loading states
    isCreating: createConfiguration.isPending,
    isUpdating: updateConfiguration.isPending,
    isDeleting: deleteConfiguration.isPending,
    isTesting: testConnection.isPending,
    isSyncing: triggerSync.isPending,
  };
};

// Hook to fetch logs for a specific configuration
export const useConfigurationLogs = (configId: string | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.configLogs(configId || ''),
    queryFn: () => configId ? platformIntegrationsApi.getLogsByConfig(configId) : Promise.resolve([]),
    enabled: !!configId,
  });
};
