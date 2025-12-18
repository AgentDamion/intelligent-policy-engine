import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Building, Users, Shield, Key, Plug, TestTube } from 'lucide-react';
import { DemoModeSettings } from '@/components/settings/DemoModeSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('organization');

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization, workspaces, users, and integrations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="demo">Demo Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <EmptyState
              title="Organization Settings"
              description="Configure your organization details, branding, and general preferences."
              icon={<Building />}
              actions={[
                {
                  label: "Edit Organization",
                  onClick: () => console.log("Edit organization"),
                  variant: "default"
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="workspaces">
            <EmptyState
              title="Workspace Management"
              description="Create and manage workspaces to organize your teams and projects. Control access and permissions per workspace."
              icon={<Building />}
              actions={[
                {
                  label: "Create Workspace",
                  onClick: () => console.log("Create workspace"),
                  variant: "default"
                },
                {
                  label: "Manage Existing",
                  onClick: () => console.log("Manage workspaces"),
                  variant: "outline"
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="users">
            <EmptyState
              title="User & Role Management"
              description="Invite team members, assign roles, and manage permissions across your organization and workspaces."
              icon={<Users />}
              actions={[
                {
                  label: "Invite Users",
                  onClick: () => console.log("Invite users"),
                  variant: "default"
                },
                {
                  label: "Manage Roles",
                  onClick: () => console.log("Manage roles"),
                  variant: "outline"
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="security">
            <EmptyState
              title="Security & Authentication"
              description="Configure SSO, API keys, security policies, and authentication settings for your organization."
              icon={<Shield />}
              actions={[
                {
                  label: "Configure SSO",
                  onClick: () => console.log("Configure SSO"),
                  variant: "default"
                },
                {
                  label: "Manage API Keys",
                  onClick: () => console.log("Manage API keys"),
                  variant: "outline",
                  icon: <Key className="h-4 w-4 mr-2" />
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="integrations">
            <EmptyState
              title="Integrations & APIs"
              description="Connect with external tools and services. Manage API endpoints, webhooks, and third-party integrations."
              icon={<Plug />}
              actions={[
                {
                  label: "Add Integration",
                  onClick: () => console.log("Add integration"),
                  variant: "default"
                },
                {
                  label: "API Documentation",
                  onClick: () => console.log("View API docs"),
                  variant: "outline"
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="demo">
            <DemoModeSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;