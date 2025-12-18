import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PartnerApiKey } from '@/components/agentic/middleware/types';
import { useToast } from '@/hooks/use-toast';
import bcrypt from 'bcryptjs';

export const usePartnerApiKeys = () => {
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys((data || []) as PartnerApiKey[]);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();

    // Real-time subscription
    const channel = supabase
      .channel('partner_api_keys_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_api_keys',
        },
        () => {
          fetchKeys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateApiKey = () => {
    const prefix = 'pak';
    const random = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
    return `${prefix}_${random}`;
  };

  const createKey = async (params: {
    name: string;
    partner_id: string;
    enterprise_id: string;
    rate_limit_tier: string;
    expires_at?: string;
    scopes?: string[];
  }): Promise<string | null> => {
    try {
      const fullKey = generateApiKey();
      const keyPrefix = fullKey.substring(0, 11); // pak_abcdefg
      const keyHash = await bcrypt.hash(fullKey, 10);

      const { error } = await supabase.from('partner_api_keys').insert({
        ...params,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: 'API Key Created',
        description: 'Your API key has been created successfully. Copy it now!',
      });

      return fullKey; // Return full key only once
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
      return null;
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('partner_api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: 'Key Revoked',
        description: 'API key has been revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke API key',
        variant: 'destructive',
      });
    }
  };

  return {
    keys,
    loading,
    createKey,
    revokeKey,
    refetch: fetchKeys,
  };
};
