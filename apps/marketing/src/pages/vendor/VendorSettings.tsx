import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const VendorSettings = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your vendor account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" placeholder="Your Company Name" />
              </div>
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" placeholder="contact@company.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="company-description">Company Description</Label>
              <Textarea 
                id="company-description" 
                placeholder="Brief description of your company and AI tools..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="https://yourcompany.com" />
              </div>
              <div>
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" placeholder="support@company.com" />
              </div>
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your tools and submissions
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Review Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your tools are reviewed
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new marketplace features
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Performance Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly reports on your tools' performance
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tax-id">Tax ID / VAT Number</Label>
              <Input id="tax-id" placeholder="Enter your tax identification number" />
            </div>
            <div>
              <Label htmlFor="bank-account">Bank Account</Label>
              <Input id="bank-account" placeholder="****-****-****-1234" disabled />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Update Payment Method</Button>
              <Button variant="outline">View Invoices</Button>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input 
                  id="api-key" 
                  value="vnd_live_sk_******************************************" 
                  disabled 
                />
                <Button variant="outline">Regenerate</Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Use this key to integrate with our marketplace API
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Webhook Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Enable webhooks for real-time updates
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Deactivate Account</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable your vendor account
                </p>
              </div>
              <Button variant="destructive" size="sm">Deactivate</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorSettings;