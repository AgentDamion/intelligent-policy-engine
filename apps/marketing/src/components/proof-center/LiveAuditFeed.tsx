import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LiveAuditFeedProps {
  auditFeed: any[];
}

export default function LiveAuditFeed({ auditFeed }: LiveAuditFeedProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>
          <Filter className="inline mr-2" />Live Audit Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input placeholder="Filter by regulatory tag" className="max-w-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Timestamp</th>
                <th className="p-2 text-left">Event</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Tool/Request</th>
                <th className="p-2 text-left">Outcome</th>
                <th className="p-2 text-left">Reg Tag</th>
                <th className="p-2 text-left">Explain</th>
              </tr>
            </thead>
            <tbody>
              {auditFeed.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{row.timestamp}</td>
                  <td className="p-2">{row.event}</td>
                  <td className="p-2">{row.user}</td>
                  <td className="p-2">{row.tool}</td>
                  <td className="p-2">
                    <Badge
                      variant={
                        row.outcome === "Approved"
                          ? "default"
                          : row.outcome === "Flagged"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {row.outcome}
                    </Badge>
                  </td>
                  <td className="p-2">{row.regTag}</td>
                  <td className="p-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm">
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Decision Explanation</DialogTitle>
                        </DialogHeader>
                        <div className="text-sm">{row.explanation}</div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}