import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { 
  fetchGovernanceEvents,
  type GovernanceEvent,
  type GovernanceStatus,
  type GovernanceEventType
} from '@/lib/data/governance';
import { EventThread } from './EventThread';

// ----------------------
// Helpers
// ----------------------
const typeMeta: Record<GovernanceEventType, { label: string; icon: React.ReactNode }> = {
  policy: { label: "Policy", icon: <ShieldCheck className="h-4 w-4" /> },
  audit: { label: "Audit", icon: <FileCheck2 className="h-4 w-4" /> },
  tool_request: { label: "Tool Request", icon: <Workflow className="h-4 w-4" /> },
};

function statusBadge(status: GovernanceStatus) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3.5 w-3.5" /> Pending
        </Badge>
      );
    case "flagged":
      return (
        <Badge className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
          <AlertTriangle className="h-3.5 w-3.5" /> Flagged
        </Badge>
      );
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

// ----------------------
// Component
// ----------------------
export const GovernanceInbox: React.FC = () => {
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | GovernanceEventType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | GovernanceStatus>("all");
  const [selected, setSelected] = useState<GovernanceEvent | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchGovernanceEvents();
      setEvents(data);
    };
    loadData();
  }, []);

  // Simulate live updates; replace with Supabase Realtime or SSE
  // TODO: Replace with Supabase Realtime subscription
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        // Simple random status nudge for demo
        const copy = [...prev];
        if (copy.length && Math.random() > 0.7) {
          const i = Math.floor(Math.random() * copy.length);
          const target = { ...copy[i] };
          if (target.status === "pending" && Math.random() > 0.5) target.status = "approved";
          else if (target.status === "pending") target.status = "flagged";
          else if (target.status === "flagged") target.status = "pending";
          target.metaLoopValidated = Math.random() > 0.4;
          target.ai_confidence = Math.min(1, Math.max(0.4, (target.ai_confidence ?? 0.8) + (Math.random() * 0.1 - 0.05)));
          copy[i] = target;
        }
        return copy;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Derived metrics
  const metrics = useMemo(() => {
    const total = events.length;
    const approved = events.filter((e) => e.status === "approved").length;
    const pending = events.filter((e) => e.status === "pending").length;
    const flagged = events.filter((e) => e.status === "flagged").length;
    const compliance = total ? Math.round((approved / total) * 100) : 0;
    const tools = events.filter((e) => e.type === "tool_request").length;
    return { total, approved, pending, flagged, compliance, tools };
  }, [events]);

  // Filters
  const filtered = useMemo(() => {
    return events
      .filter((e) => (typeFilter === "all" ? true : e.type === typeFilter))
      .filter((e) => (statusFilter === "all" ? true : e.status === statusFilter))
      .filter((e) => {
        if (!query) return true;
        const hay = `${e.title} ${e.summary ?? ""}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, typeFilter, statusFilter, query]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Filters */}
        <div className="col-span-12 xl:col-span-3 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Filters</CardTitle>
              <CardDescription>Refine the governance feed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative group">
                <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  className="pl-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="Ask a question or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <div className="absolute right-2 top-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Search className="h-3 w-3" />
                      {filtered.length}
                    </Badge>
                  </div>
                )}
              </div>
              
              {query && filtered.length > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Found {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
                </div>
              )}

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Type</span>
              </div>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="tool_request">Tool Requests</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 pt-2">
                <Gauge className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* KPI Overview */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Overview</CardTitle>
              <CardDescription>Live governance KPIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Kpi label="Compliance" value={`${metrics.compliance}%`} icon={<ShieldCheck className="h-4 w-4" />} />
                <Kpi label="Events" value={String(metrics.total)} icon={<Sparkles className="h-4 w-4" />} />
                <Kpi label="Tools" value={String(metrics.tools)} icon={<Workflow className="h-4 w-4" />} />
              </div>
              <Progress value={metrics.compliance} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Approved: {metrics.approved}</div>
                <div>Pending: {metrics.pending}</div>
                <div>Flagged: {metrics.flagged}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity Feed */}
        <div className="col-span-12 xl:col-span-9">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Governance Inbox</h2>
              <p className="text-sm text-muted-foreground">Real-time policy, audit, and tool request activity</p>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <EventThread 
                    event={e}
                    onQuickAction={(eventId, action) => {
                      console.log(`Quick action: ${action} on event ${eventId}`);
                      if (action === 'approve' || action === 'flag') {
                        // TODO: Implement actual action handlers
                      }
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center text-muted-foreground">
                  No results. Adjust filters or search query.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selected && typeMeta[selected.type].icon}
              {selected?.title}
            </SheetTitle>
          </SheetHeader>

          {selected && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-2">{statusBadge(selected.status)}</div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium">Summary</h4>
                <p className="text-sm text-muted-foreground">{selected.summary ?? "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> AI Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-semibold">{Math.round((selected.ai_confidence ?? 0) * 100)}%</div>
                    <p className="text-xs text-muted-foreground">Automated assessment from Policy Agent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Workflow className="h-4 w-4" /> Meta-Loop
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-semibold">{selected.metaLoopValidated ? "Validated" : "Pending"}</div>
                    <p className="text-xs text-muted-foreground">Recursive self-check of governance flow</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline"><Clock className="h-4 w-4 mr-1" /> Snooze</Button>
                  <Button size="sm" variant="secondary"><FileCheck2 className="h-4 w-4 mr-1" /> View Audit Trail</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700"><AlertTriangle className="h-4 w-4 mr-1" /> Flag</Button>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium">Timestamps</h4>
                <p className="text-xs text-muted-foreground">Created: {new Date(selected.timestamp).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Last Updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};

// ----------------------
// Small subcomponents
// ----------------------
function Kpi({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-2.5 flex flex-col items-center text-center gap-1">
      <div className="rounded-md bg-muted/40 p-1.5 text-muted-foreground">
        {icon}
      </div>
      <div className="text-lg font-bold tracking-tight">
        {value}
      </div>
      <div className="text-xs text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
}

// ----------------------
// Integration Notes (TODO - remove after wiring):
// 1) Replace fetchGovernanceEvents with Supabase query from policy_events, audit_logs, tool_requests tables
// 2) Use Supabase Realtime or FastAPI SSE for live updates instead of setInterval
// 3) Wire action buttons to your existing routes (approve/flag) and write to the Audit Engine
// 4) Map Policy Agent + Meta-Loop signals to ai_confidence/metaLoopValidated fields
// 5) Add RBAC guards (Enterprise vs Agency vs Admin) before enabling mutation actions
// ----------------------
