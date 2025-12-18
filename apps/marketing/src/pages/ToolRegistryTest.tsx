import { useEffect, useState } from 'react';
import { AIToolsService } from '@/services/aiToolsService';
import { AITool } from '@/types/aiTools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const ToolRegistryTest = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await AIToolsService.getTools();
      setTools(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (riskTier?: string) => {
    switch (riskTier) {
      case 'LOW': return 'outline';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'banned': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'draft': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'deprecated': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const groupedTools = {
    llm: tools.filter(t => t.category === 'llm'),
    video_gen: tools.filter(t => t.category === 'video_gen'),
    image_gen: tools.filter(t => t.category === 'image_gen'),
    audio_gen: tools.filter(t => t.category === 'audio_gen'),
    code_assist: tools.filter(t => t.category === 'code_assist'),
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading tool registry...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Tool Registry - Week 1-2 Test</h1>
          <p className="text-muted-foreground mt-2">
            Multi-modal tool registry with {tools.length} tools across 5 categories
          </p>
        </div>
        <Button onClick={loadTools}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tools.filter(t => t.deployment_status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {tools.filter(t => t.deployment_status === 'banned').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {tools.filter(t => t.risk_tier === 'HIGH' || t.risk_tier === 'CRITICAL').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="llm">LLM ({groupedTools.llm.length})</TabsTrigger>
          <TabsTrigger value="video_gen">Video ({groupedTools.video_gen.length})</TabsTrigger>
          <TabsTrigger value="image_gen">Image ({groupedTools.image_gen.length})</TabsTrigger>
          <TabsTrigger value="audio_gen">Audio ({groupedTools.audio_gen.length})</TabsTrigger>
          <TabsTrigger value="code_assist">Code ({groupedTools.code_assist.length})</TabsTrigger>
        </TabsList>

        {Object.entries(groupedTools).map(([category, categoryTools]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {categoryTools.map(tool => (
              <Card key={tool.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{tool.name}</CardTitle>
                        {getStatusIcon(tool.deployment_status)}
                      </div>
                      <CardDescription className="mt-1">
                        {tool.provider} • {tool.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getRiskBadgeVariant(tool.risk_tier)}>
                        {tool.risk_tier || 'UNSET'}
                      </Badge>
                      <Badge variant={tool.deployment_status === 'approved' ? 'default' : 'secondary'}>
                        {tool.deployment_status || 'draft'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>{' '}
                      <span className="text-muted-foreground">{tool.category}</span>
                    </div>
                    {tool.jurisdictions && tool.jurisdictions.length > 0 && (
                      <div>
                        <span className="font-medium">Jurisdictions:</span>{' '}
                        <span className="text-muted-foreground">
                          {tool.jurisdictions.join(', ')}
                        </span>
                      </div>
                    )}
                    {tool.data_sensitivity_used && tool.data_sensitivity_used.length > 0 && (
                      <div>
                        <span className="font-medium">Data Sensitivity:</span>{' '}
                        <span className="text-muted-foreground">
                          {tool.data_sensitivity_used.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ToolRegistryTest;
