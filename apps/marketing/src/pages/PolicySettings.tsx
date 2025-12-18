import React from 'react';
import Navigation from '@/components/Navigation';
import NewFooter from '@/components/NewFooter';
import PolicyCustomization from '@/components/policy/PolicyCustomization';
import { Shield, Settings } from 'lucide-react';

export default function PolicySettings() {
  return (
    <div className="min-h-screen bg-brand-warm-white">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-brand-dark mb-4 font-heading">
              Policy Builder
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Build custom compliance policies from industry-standard templates
            </p>
          </div>

          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Template Selection</h3>
              <p className="text-sm text-muted-foreground">
                Choose from industry-specific policy templates designed for your compliance needs.
              </p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Rule Customization</h3>
              <p className="text-sm text-muted-foreground">
                Modify individual policy rules to align with your organization's requirements.
              </p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Live Deployment</h3>
              <p className="text-sm text-muted-foreground">
                Deploy customized policies instantly across your AI governance infrastructure.
              </p>
            </div>
          </div>

          {/* Policy Customization Component */}
          <PolicyCustomization 
            organizationId="b3a15512-fb3c-43e2-9d70-b6fdd8dedea6"
            organizationType="enterprise"
          />
        </div>
      </div>

      <NewFooter />
    </div>
  );
}