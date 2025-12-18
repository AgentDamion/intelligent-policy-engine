import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Search, Filter, Clock, User, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  details?: any;
  created_at: string;
}

const AuditsPage: React.FC = () => {
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = audits.filter(audit =>
    audit.event_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('policy')) return FileText;
    if (eventType.includes('user')) return User;
    return Clock;
  };

  const getEventBadgeVariant = (eventType: string): "default" | "secondary" | "destructive" | "outline" => {
    if (eventType.includes('create')) return 'default';
    if (eventType.includes('update')) return 'secondary';
    if (eventType.includes('delete')) return 'destructive';
    return 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-muted-foreground mt-1">
            Complete history of governance activities and decisions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audits.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {audits.filter(a => 
                new Date(a.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {audits.filter(a => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(a.created_at) > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>Chronological audit log</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse border-l-2 border-muted pl-4 py-3">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredAudits.length > 0 ? (
            <div className="space-y-4">
              {filteredAudits.map((audit) => {
                const EventIcon = getEventIcon(audit.event_type);
                return (
                  <div key={audit.id} className="border-l-2 border-primary/20 pl-4 py-3 hover:bg-muted/50 transition-colors rounded-r">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          <EventIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getEventBadgeVariant(audit.event_type)}>
                              {audit.event_type.replace(/_/g, ' ')}
                            </Badge>
                            {audit.entity_type && (
                              <span className="text-sm text-muted-foreground">
                                {audit.entity_type}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {audit.details?.message || 'Event logged'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(audit.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No audit events found</p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Audit events will appear here as actions are performed'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditsPage;
