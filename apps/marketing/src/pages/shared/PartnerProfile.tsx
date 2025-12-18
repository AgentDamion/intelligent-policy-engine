import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building, Users, FileText, AlertTriangle, Shield, Settings } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

const PartnerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock partner data
  const partner = {
    id: id,
    name: "MedTech Innovations",
    type: "Healthcare Technology Partner",
    status: "Active",
    joinDate: "2023-06-15",
    complianceScore: 87,
    totalTools: 12,
    activeSubmissions: 3,
    resolvedConflicts: 15,
    members: 8
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{partner.name}</h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{partner.type}</Badge>
              <Badge className="bg-brand-green text-white">{partner.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Partner since {new Date(partner.joinDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <Button variant="outline" size="sm">
              Send Message
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-brand-teal">{partner.complianceScore}%</div>
              <div className="text-sm text-muted-foreground">Compliance Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{partner.totalTools}</div>
              <div className="text-sm text-muted-foreground">Total Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{partner.activeSubmissions}</div>
              <div className="text-sm text-muted-foreground">Active Submissions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{partner.members}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Partner Type</p>
                      <p className="text-sm text-muted-foreground">{partner.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge className="bg-brand-green text-white">{partner.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Join Date</p>
                      <p className="text-sm text-muted-foreground">{new Date(partner.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Team Size</p>
                      <p className="text-sm text-muted-foreground">{partner.members} members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Score</span>
                      <span className="text-sm font-medium">{partner.complianceScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-brand-teal h-2 rounded-full" 
                        style={{ width: `${partner.complianceScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Active Tools</p>
                      <p className="text-muted-foreground">{partner.totalTools} tools</p>
                    </div>
                    <div>
                      <p className="font-medium">Resolved Issues</p>
                      <p className="text-muted-foreground">{partner.resolvedConflicts} conflicts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools">
            <EmptyState
              title="Partner Tools"
              description="View all AI tools managed by this partner, their compliance status, and usage across different workspaces."
              icon={<Building />}
            />
          </TabsContent>

          <TabsContent value="submissions">
            <EmptyState
              title="Submission History"
              description="Track all submissions from this partner with status, timeline, and compliance outcomes."
              icon={<FileText />}
            />
          </TabsContent>

          <TabsContent value="conflicts">
            <EmptyState
              title="Conflict Resolution"
              description="Monitor and resolve policy conflicts, timeline issues, and compliance disputes with this partner."
              icon={<AlertTriangle />}
            />
          </TabsContent>

          <TabsContent value="compliance">
            <EmptyState
              title="Compliance Details"
              description="Detailed compliance metrics, policy adherence, and improvement recommendations for this partner."
              icon={<Shield />}
            />
          </TabsContent>

          <TabsContent value="members">
            <EmptyState
              title="Team Members"
              description="Manage partner team members, their roles, and access permissions across workspaces."
              icon={<Users />}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartnerProfile;