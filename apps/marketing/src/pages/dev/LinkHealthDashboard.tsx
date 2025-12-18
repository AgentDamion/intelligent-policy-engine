import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileQuestion,
  Download,
  RefreshCw,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { generateLinkReport, LinkInventoryReport, exportReportMarkdown, exportNavigationMermaid } from '@/utils/linkValidator';

export default function LinkHealthDashboard() {
  const [report, setReport] = useState<LinkInventoryReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const newReport = await generateLinkReport();
      setReport(newReport);
    } catch (error) {
      console.error('Link validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const downloadMarkdown = () => {
    if (!report) return;
    const md = exportReportMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-inventory-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const downloadMermaid = () => {
    if (!report) return;
    const mmd = exportNavigationMermaid(report);
    const blob = new Blob([mmd], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navigation-map-${new Date().toISOString().split('T')[0]}.mmd`;
    a.click();
  };

  const healthScore = report 
    ? Math.round((report.summary.workingLinks / report.summary.totalLinks) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Link Health Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive link validation and navigation integrity monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runValidation} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={downloadMarkdown} disabled={!report} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={downloadMermaid} disabled={!report} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Diagram
          </Button>
        </div>
      </div>

      {loading && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>Scanning codebase...</AlertTitle>
          <AlertDescription>
            Analyzing all navigation patterns and validating routes
          </AlertDescription>
        </Alert>
      )}

      {report && (
        <>
          {/* Health Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Link Health
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(report.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">{healthScore}%</div>
                <div className="flex-1">
                  <Progress value={healthScore} className="h-3" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  label="Working"
                  value={report.summary.workingLinks}
                  total={report.summary.totalLinks}
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                  label="Temporary"
                  value={report.summary.temporaryLinks}
                  total={report.summary.totalLinks}
                />
                <StatCard
                  icon={<XCircle className="h-5 w-5 text-red-600" />}
                  label="Broken"
                  value={report.summary.brokenLinks}
                  total={report.summary.totalLinks}
                />
                <StatCard
                  icon={<FileQuestion className="h-5 w-5 text-yellow-600" />}
                  label="Orphaned"
                  value={report.summary.orphanedRoutes}
                  total={report.summary.totalLinks}
                />
                <StatCard
                  icon={<ExternalLink className="h-5 w-5 text-blue-600" />}
                  label="Total Links"
                  value={report.summary.totalLinks}
                  total={report.summary.totalLinks}
                />
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          {report.criticalIssues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>🚨 {report.criticalIssues.length} Critical Issues Found</AlertTitle>
              <AlertDescription>
                Broken links or frequently used temporary implementations detected. Review the issues below.
              </AlertDescription>
            </Alert>
          )}

          {/* Section Breakdown */}
          <Tabs defaultValue="enterprise" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="enterprise">Enterprise ({report.bySection.enterprise.length})</TabsTrigger>
              <TabsTrigger value="governance">Governance ({report.bySection.governance.length})</TabsTrigger>
              <TabsTrigger value="agency">Agency ({report.bySection.agency.length})</TabsTrigger>
              <TabsTrigger value="vendor">Vendor ({report.bySection.vendor.length})</TabsTrigger>
              <TabsTrigger value="critical">Critical ({report.criticalIssues.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="enterprise" className="space-y-3">
              <LinkList results={report.bySection.enterprise} />
            </TabsContent>

            <TabsContent value="governance" className="space-y-3">
              <LinkList results={report.bySection.governance} />
            </TabsContent>

            <TabsContent value="agency" className="space-y-3">
              <LinkList results={report.bySection.agency} />
            </TabsContent>

            <TabsContent value="vendor" className="space-y-3">
              <LinkList results={report.bySection.vendor} />
            </TabsContent>

            <TabsContent value="critical" className="space-y-3">
              <LinkList results={report.criticalIssues} showReferences />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, total }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{percentage}%</div>
      </CardContent>
    </Card>
  );
}

function LinkList({ results, showReferences = false }: { 
  results: any[]; 
  showReferences?: boolean;
}) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No links in this section
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    working: { icon: CheckCircle2, color: 'bg-emerald-600', label: 'Working' },
    temporary: { icon: AlertTriangle, color: 'bg-amber-600', label: 'Temporary' },
    broken: { icon: XCircle, color: 'bg-red-600', label: 'Broken' },
    orphaned: { icon: FileQuestion, color: 'bg-yellow-600', label: 'Orphaned' },
  };

  return (
    <>
      {results.map((result) => {
        const config = statusConfig[result.status];
        const Icon = config.icon;

        return (
          <Card key={result.path}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {result.path}
                    </code>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                  
                  {result.implementationNotes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.implementationNotes}
                    </p>
                  )}

                  {showReferences && result.references.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        References ({result.references.length}):
                      </p>
                      {result.references.map((ref: any, idx: number) => (
                        <div key={idx} className="text-xs font-mono text-muted-foreground ml-4">
                          • {ref.file}:{ref.line} ({ref.linkType})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {result.references.length > 0 && (
                    <span>{result.references.length} ref{result.references.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
