import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Server, Code, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CursorBackendGuide = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const corsExample = `// Express.js CORS configuration
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:8080',  // Lovable dev server
    'https://YOUR-APP.lovable.app',
    'https://YOUR-STAGING.lovable.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['authorization', 'apikey', 'content-type'],
  credentials: false
}));`;

  const healthEndpoint = `// Health check endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MetaLoop Backend Active',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/policies',
      'POST /api/policies',
      'GET /api/agencies',
      'GET /api/submissions',
      'GET /api/dashboard/enterprise/:id',
      'GET /api/audit-feed',
      'GET /api/metrics',
      // ... add all your endpoints
    ]
  });
});`;

  const sampleResponses = `// Sample API responses
// GET /api/metrics
{
  "success": true,
  "metrics": {
    "avgApprovalTime": "2.1h",
    "humanInLoopRate": "14%",
    "regulatoryCoverage": "92%",
    "auditCompleteness": "98%"
  }
}

// GET /api/audit-feed
{
  "success": true,
  "feed": [
    {
      "id": "uuid",
      "timestamp": "2025-08-16T12:00:00Z",
      "action": "POLICY_APPROVED",
      "actor": "user@email.com",
      "details": { ... }
    }
  ]
}

// GET /api/policy-templates
{
  "success": true,
  "templates": [
    {
      "id": "uuid",
      "name": "HCP Marketing",
      "description": "Healthcare professional marketing compliance",
      "industry": "pharma",
      "template_type": "governance",
      "base_rules": { ... }
    }
  ]
}`;

  const webSocketExample = `// WebSocket implementation (optional)
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send live metrics updates
  const metricsInterval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'live-metrics',
      data: {
        decisions_today: Math.floor(Math.random() * 100),
        compliance_rate: '98%',
        // ... other metrics
      }
    }));
  }, 5000);
  
  ws.on('close', () => {
    clearInterval(metricsInterval);
  });
});`;

  const endpoints = [
    { method: 'GET', path: '/api', description: 'Health check and endpoint discovery' },
    { method: 'GET', path: '/api/policies', description: 'List all policies' },
    { method: 'POST', path: '/api/policies', description: 'Create new policy' },
    { method: 'GET', path: '/api/agencies', description: 'List agencies' },
    { method: 'GET', path: '/api/submissions', description: 'List submissions' },
    { method: 'GET', path: '/api/agency/:id/policies/inbox', description: 'Agency policy inbox' },
    { method: 'GET', path: '/api/dashboard/enterprise/:id', description: 'Enterprise dashboard stats' },
    { method: 'GET', path: '/api/audit-feed', description: 'Audit activity feed' },
    { method: 'GET', path: '/api/metrics', description: 'Key performance metrics' },
    { method: 'GET', path: '/api/case-studies', description: 'Case studies data' },
    { method: 'GET', path: '/api/regulatory-mapping', description: 'Regulatory framework mapping' },
    { method: 'GET', path: '/api/trends', description: 'Compliance trends data' },
    { method: 'GET', path: '/api/dashboard/live-metrics', description: 'Live dashboard metrics' },
    { method: 'GET', path: '/api/recent-decisions', description: 'Recent AI decisions' },
    { method: 'GET', path: '/api/policy-templates', description: 'Policy templates' },
    { method: 'POST', path: '/api/policy-templates/customize-policy', description: 'Customize policy' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Cursor Backend Setup Guide
          </CardTitle>
          <CardDescription>
            Complete guide to connect your Cursor backend with the MetaLoop frontend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Port Configuration:</strong> Run your backend on <code>http://localhost:3000</code> (default). 
              The Lovable frontend runs on port <code>8080</code>. Use the API Settings button in the header to configure different ports if needed.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="endpoints" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="cors">CORS</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="websocket">WebSocket</TabsTrigger>
              <TabsTrigger value="deployment">Deploy</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Required API Endpoints</h3>
                <div className="space-y-2">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Health Check Implementation</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(healthEndpoint, 'Health endpoint code')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-sm overflow-x-auto"><code>{healthEndpoint}</code></pre>
              </div>
            </TabsContent>

            <TabsContent value="cors" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">CORS Configuration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your backend to allow requests from Lovable domains and localhost.
                </p>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Express.js CORS Setup</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(corsExample, 'CORS configuration')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto"><code>{corsExample}</code></pre>
                </div>

                <Alert className="mt-4">
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Update the origin URLs to match your actual Lovable app domains. 
                    You can find these in your Lovable project settings.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Response Formats</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Expected JSON response structures for key endpoints.
                </p>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Sample API Responses</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(sampleResponses, 'Sample responses')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto"><code>{sampleResponses}</code></pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="websocket" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">WebSocket Support (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add real-time updates for live metrics and decision feeds.
                </p>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">WebSocket Server Example</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webSocketExample, 'WebSocket code')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto"><code>{webSocketExample}</code></pre>
                </div>

                <Alert className="mt-4">
                  <Code className="h-4 w-4" />
                  <AlertDescription>
                    WebSocket support enables real-time updates for the MetaLoop dashboard. 
                    Configure the WebSocket URL in API Settings to match your server.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Deployment Checklist</h3>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Local Development</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• <strong>Lovable frontend:</strong> Runs on http://localhost:8080 (automatic)</li>
                      <li>• <strong>Cursor backend:</strong> Run on http://localhost:3000 (recommended)</li>
                      <li>• Configure CORS for localhost:8080 and your Lovable preview URL</li>
                      <li>• Use API Settings button in header to configure different ports</li>
                      <li>• Test all endpoints using the Backend Test page</li>
                      <li>• Verify MetaLoop Status badge shows "Active"</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Production Deployment</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Deploy backend to a stable URL (e.g., https://api.yourdomain.com)</li>
                      <li>• Update CORS origins to include your published Lovable app URL</li>
                      <li>• Update API Base URL in frontend settings</li>
                      <li>• Configure SSL/HTTPS for production</li>
                      <li>• Set up monitoring and logging</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Security Considerations</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Implement rate limiting on API endpoints</li>
                      <li>• Validate and sanitize all input data</li>
                      <li>• Use HTTPS in production</li>
                      <li>• Keep API keys and secrets on the backend only</li>
                      <li>• Consider implementing API authentication if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CursorBackendGuide;
