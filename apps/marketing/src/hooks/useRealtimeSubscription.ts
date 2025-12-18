import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onData?: (payload: any) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export const useRealtimeSubscription = ({
  table,
  event = '*',
  filter,
  onData,
  onError,
  enabled = true
}: RealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !table) return;

    const channelName = `realtime-${table}-${event}-${Date.now()}`;
    
    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event,
            schema: 'public',
            table,
            filter
          },
          (payload: any) => {
            monitoring.info(`Realtime update received`, {
              table,
              event: payload.eventType,
              new: payload.new,
              old: payload.old
            }, 'realtime');
            
            onData?.(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isConnectedRef.current = true;
            monitoring.info(`Realtime subscription active`, { table, event }, 'realtime');
          } else if (status === 'CHANNEL_ERROR') {
            isConnectedRef.current = false;
            const error = new Error(`Realtime subscription error for ${table}`);
            monitoring.error('Realtime subscription failed', error, 'realtime');
            onError?.(error);
          } else if (status === 'TIMED_OUT') {
            isConnectedRef.current = false;
            const error = new Error(`Realtime subscription timed out for ${table}`);
            monitoring.error('Realtime subscription timed out', error, 'realtime');
            onError?.(error);
          }
        });

      channelRef.current = channel;

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create realtime subscription');
      monitoring.error('Failed to create realtime subscription', err, 'realtime');
      onError?.(err);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isConnectedRef.current = false;
        monitoring.info(`Realtime subscription cleaned up`, { table, event }, 'realtime');
      }
    };
  }, [table, event, filter, enabled, onData, onError]);

  return {
    isConnected: isConnectedRef.current,
    disconnect: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isConnectedRef.current = false;
      }
    }
  };
};

export default useRealtimeSubscription;