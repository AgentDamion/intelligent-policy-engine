import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Shield, RefreshCw } from 'lucide-react';

const FeatherIcon = () => (
  <svg width="16" height="16" viewBox="0 0 28 28" fill="none" className="w-4 h-4">
    <path d="M8 24C19 12 23 5 17 5C11 5 5 17 8 24Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M11 18C13 15 17 11 17 11" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

const HummingbirdIcon = () => (
  <svg width="16" height="12" viewBox="0 0 32 24" fill="none" className="w-4 h-3">
    <path d="M2 12 L14 10 L24 4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <ellipse cx="16" cy="12" rx="7" ry="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="19" cy="12" r="1.2" fill="currentColor"/>
    <path d="M14 10 Q10 6 7 16 Q14 14 14 10" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

interface QuickActionsProps {
  loading: boolean;
  onRefresh: () => void;
}

const QuickActions = ({ loading, onRefresh }: QuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Let your copilot refresh your dashboard, review policies, or add clients—all just a click away!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={onRefresh} 
            disabled={loading}
            className="bg-teal hover:bg-teal/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? <FeatherIcon /> : <FeatherIcon />}
            <span className="ml-2">{loading ? 'Refreshing Dashboard...' : 'Refresh Dashboard'}</span>
          </Button>
          <Button variant="outline" className="border-orange text-orange hover:bg-orange hover:text-white transition-colors duration-200">
            <Shield className="mr-2 h-4 w-4" />
            New Policy Review
          </Button>
          <Button variant="outline" className="border-teal text-teal hover:bg-teal hover:text-white transition-colors duration-200">
            <HummingbirdIcon />
            <span className="ml-2">Invite Client</span>
          </Button>
          <Button variant="outline" className="border-orange text-orange hover:bg-orange hover:text-white transition-colors duration-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2 w-4 h-4">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
            View Audit Trail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;