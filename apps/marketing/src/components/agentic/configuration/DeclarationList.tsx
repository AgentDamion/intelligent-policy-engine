import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeclarationListProps {
  filters: any;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DeclarationList({ filters, selectedId, onSelect }: DeclarationListProps) {
  const { toast } = useToast();

  const { data: declarations, isLoading, refetch } = useQuery({
    queryKey: ['asset-declarations', filters],
    queryFn: async () => {
      let query = supabase
        .from('asset_declarations')
        .select('*')
        .order('declared_at', { ascending: false })
        .limit(100);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('validation_status', filters.status);
      }
      if (filters.riskTier && filters.riskTier !== 'all') {
        query = query.eq('aggregated_risk_tier', filters.riskTier);
      }
      if (filters.fileType) {
        query = query.ilike('file_type', `%${filters.fileType}%`);
      }
      if (filters.dateRange.from) {
        query = query.gte('declared_at', filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query = query.lte('declared_at', filters.dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('asset-declarations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_declarations',
        },
        () => {
          refetch();
          toast({
            title: 'New Declaration',
            description: 'A new asset declaration has been submitted',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  const exportToCSV = () => {
    if (!declarations || declarations.length === 0) return;

    const headers = ['ID', 'File Name', 'Status', 'Risk Tier', 'Declared At'];
    const rows = declarations.map(d => [
      d.id,
      d.file_name || 'N/A',
      d.validation_status,
      d.aggregated_risk_tier || 'N/A',
      new Date(d.declared_at).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-declarations-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Declarations exported to CSV successfully',
    });
  };

  if (isLoading) {
    return (
      <Card className="p-4 h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading declarations...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          Declarations ({declarations?.length || 0})
        </h3>
        <Button size="sm" variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {declarations?.map((declaration) => (
            <div
              key={declaration.id}
              onClick={() => onSelect(declaration.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedId === declaration.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">
                    {declaration.file_name || 'Unnamed File'}
                  </span>
                </div>
                <Badge
                  variant={
                    declaration.validation_status === 'compliant'
                      ? 'default'
                      : declaration.validation_status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="text-xs"
                >
                  {declaration.validation_status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {declaration.aggregated_risk_tier || 'N/A'}
                </Badge>
                <span>•</span>
                <span>{new Date(declaration.declared_at).toLocaleDateString()}</span>
              </div>

              {declaration.file_type && (
                <p className="text-xs text-muted-foreground mt-1">{declaration.file_type}</p>
              )}
            </div>
          ))}

          {declarations?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No declarations found
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
