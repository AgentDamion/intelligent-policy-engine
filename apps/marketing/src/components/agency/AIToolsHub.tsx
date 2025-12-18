import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Filter
} from "lucide-react";
import AIToolPortfolio from './AIToolPortfolio';

const AIToolsHub: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState({
    toolsOverview: true,
    recentActivity: false,
    approvalQueue: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* AI Tools Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Total Tools</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-muted-foreground text-sm">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Approved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-muted-foreground text-sm">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Pending Review</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-muted-foreground text-sm">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-sm">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Status Overview */}
      <Card>
        <Collapsible
          open={expandedSections.toolsOverview}
          onOpenChange={() => toggleSection('toolsOverview')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Tools Performance Overview</CardTitle>
                </div>
                {expandedSections.toolsOverview ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <CardDescription>
                Performance metrics and usage statistics
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2.3s</div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1,247</div>
                  <div className="text-sm text-muted-foreground">Daily Requests</div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Approval Queue */}
      <Card>
        <Collapsible
          open={expandedSections.approvalQueue}
          onOpenChange={() => toggleSection('approvalQueue')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <CardTitle>Approval Queue</CardTitle>
                </div>
                {expandedSections.approvalQueue ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <CardDescription>
                Tools awaiting your review and approval
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "ChatGPT-4o", client: "TechCorp", priority: "High", date: "2 hours ago" },
                  { name: "Claude 3.5", client: "StartupXYZ", priority: "Medium", date: "1 day ago" },
                  { name: "Gemini Pro", client: "Enterprise Inc", priority: "Low", date: "3 days ago" }
                ].map((tool, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-sm text-muted-foreground">{tool.client}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={tool.priority === 'High' ? 'destructive' : tool.priority === 'Medium' ? 'default' : 'secondary'}>
                        {tool.priority}
                      </Badge>
                      <div className="text-sm text-muted-foreground">{tool.date}</div>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common AI tool management tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm">Bulk Approve</Button>
            <Button variant="outline" size="sm">Export Report</Button>
            <Button variant="outline" size="sm">Update Policies</Button>
            <Button variant="outline" size="sm">Run Security Scan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed AI Tools Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle>AI Tools Portfolio</CardTitle>
          <CardDescription>
            Detailed view of all AI tools across client workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIToolPortfolio />
        </CardContent>
      </Card>
    </div>
  );
};

export default AIToolsHub;