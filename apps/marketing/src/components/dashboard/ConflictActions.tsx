import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BarChart3 } from "lucide-react";

interface ConflictActionsProps {
  onConflictsClick: () => void;
  onAnalyticsClick: () => void;
}

const ConflictActions = ({ onConflictsClick, onAnalyticsClick }: ConflictActionsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            High Priority Conflicts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-red-50 rounded">
              <span className="text-sm">Pfizer vs Internal AI Policy</span>
              <Badge className="bg-red-100 text-red-800">High</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
              <span className="text-sm">Novartis Timeline Conflicts</span>
              <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={onConflictsClick}
          >
            Analyze All Conflicts
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Compliance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Average Compliance Score</span>
              <span className="font-medium">85.7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Trend (30 days)</span>
              <span className="text-green-600 font-medium">+3.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Policies Updated</span>
              <span className="font-medium">12 this month</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={onAnalyticsClick}
          >
            View Detailed Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConflictActions;