import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Filter, RefreshCw, Shield, CheckCircle, XCircle } from "lucide-react";
import { AuditService, AuditEvent } from "@/services/ProofBundleService";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditTrailViewerProps {
  enterpriseId: string;
  policyInstanceId?: string;
}

export function AuditTrailViewer({ enterpriseId, policyInstanceId }: AuditTrailViewerProps) {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAuditTrail();
  }, [enterpriseId, policyInstanceId]);

  const loadAuditTrail = async () => {
    setIsLoading(true);
    try {
      const events = policyInstanceId
        ? await AuditService.getPolicyAuditTrail(policyInstanceId)
        : await AuditService.getEnterpriseAuditTrail(enterpriseId);
      
      setAuditEvents(events);
    } catch (error) {
      console.error('Error loading audit trail:', error);
      toast.error('Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const exportData = await AuditService.exportAuditTrail(enterpriseId, format);
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${format === 'json' ? 'export.json' : 'export.csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Audit trail exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      toast.error('Failed to export audit trail');
    }
  };

  const filteredEvents = auditEvents.filter(event => {
    const matchesType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    const matchesSearch = !searchQuery || 
      event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.entity_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const eventTypes = Array.from(new Set(auditEvents.map(e => e.event_type)));

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('approved') || eventType.includes('proof_generated')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (eventType.includes('rejected') || eventType.includes('violation')) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <Shield className="h-4 w-4 text-blue-600" />;
  };

  const getEventBadgeVariant = (eventType: string): "default" | "secondary" | "destructive" | "outline" => {
    if (eventType.includes('approved') || eventType.includes('proof')) return 'default';
    if (eventType.includes('rejected') || eventType.includes('violation')) return 'destructive';
    return 'secondary';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Policy Audit Trail
            </CardTitle>
            <CardDescription>
              Immutable record of all policy-related actions and decisions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAuditTrail} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by event type or entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading audit trail...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit events found
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="border-l-4 border-l-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getEventBadgeVariant(event.event_type)}>
                              {event.event_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm:ss')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                              <span className="text-muted-foreground">Entity:</span>{' '}
                              <span className="font-mono text-xs">{event.entity_type}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Entity ID:</span>{' '}
                              <span className="font-mono text-xs">{event.entity_id.slice(0, 8)}...</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">User:</span>{' '}
                              <span className="font-mono text-xs">
                                {event.user_id ? event.user_id.slice(0, 8) + '...' : 'System'}
                              </span>
                            </div>
                            {event.ip_address && (
                              <div>
                                <span className="text-muted-foreground">IP:</span>{' '}
                                <span className="font-mono text-xs">{event.ip_address}</span>
                              </div>
                            )}
                          </div>
                          {event.details && Object.keys(event.details).length > 0 && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm text-primary hover:underline">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                                {JSON.stringify(event.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredEvents.length} of {auditEvents.length} events
            </span>
            <span>
              Immutable audit trail • Cryptographically verified
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
