import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, FileText } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AuditTrailDeepDive() {
  const [filter, setFilter] = useState('');

  const auditData = [
    {
      id: 1,
      timestamp: '2024-01-15 14:23:45',
      event: 'Policy Evaluation',
      user: 'AI Agent',
      tool: 'Content Generator',
      outcome: 'Approved',
      regTag: 'FDA 21 CFR 820',
      explanation: 'Content meets pharmaceutical marketing guidelines for accuracy and claims substantiation.',
      downloadUrl: '/sample-audit-report.pdf'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:22:10',
      event: 'Data Access Request',
      user: 'System',
      tool: 'Database Query',
      outcome: 'Flagged',
      regTag: 'GDPR Art. 32',
      explanation: 'Access request required additional authentication due to sensitive data classification.',
      downloadUrl: '/gdpr-audit-report.pdf'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:33',
      event: 'Model Inference',
      user: 'API Client',
      tool: 'ML Model',
      outcome: 'Approved',
      regTag: 'ISO 13485',
      explanation: 'Model output passed bias detection and quality thresholds for medical device classification.',
      downloadUrl: '/iso-audit-report.pdf'
    }
  ];

  const filteredData = auditData.filter(item => 
    item.event.toLowerCase().includes(filter.toLowerCase()) ||
    item.regTag.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Audit Trail Deep Dive
          </h2>
          <p className="text-lg text-muted-foreground">
            Detailed audit trail viewer with filtering and downloadable compliance reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Live Audit Trail
            </CardTitle>
            <div className="flex gap-4 mt-4">
              <Input 
                placeholder="Filter by event or regulation..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-md"
              />
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left">Timestamp</th>
                    <th className="p-3 text-left">Event</th>
                    <th className="p-3 text-left">User/System</th>
                    <th className="p-3 text-left">Tool</th>
                    <th className="p-3 text-left">Outcome</th>
                    <th className="p-3 text-left">Regulatory Citation</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{item.timestamp}</td>
                      <td className="p-3 font-medium">{item.event}</td>
                      <td className="p-3 text-sm">{item.user}</td>
                      <td className="p-3 text-sm">{item.tool}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.outcome === 'Approved' ? 'default' :
                            item.outcome === 'Flagged' ? 'destructive' : 'secondary'
                          }
                        >
                          {item.outcome}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm font-mono">{item.regTag}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Audit Decision Explanation</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <strong>Event:</strong> {item.event}
                                </div>
                                <div>
                                  <strong>Regulatory Citation:</strong> {item.regTag}
                                </div>
                                <div>
                                  <strong>Explanation:</strong>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {item.explanation}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.downloadUrl} download>
                              <FileText className="mr-1 h-3 w-3" />
                              PDF
                            </a>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}