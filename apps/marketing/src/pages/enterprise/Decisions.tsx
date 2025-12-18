import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DecisionReviewDashboard } from '@/components/compliance/DecisionReviewDashboard';
import { RiskScoreVisualization } from '@/components/compliance/RiskScoreVisualization';
import { EvidenceViewer } from '@/components/compliance/EvidenceViewer';
import { AuditTrail } from '@/components/compliance/AuditTrail';

const Decisions = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Compliance Decisions</h1>
        <p className="text-muted-foreground">
          Comprehensive decision management with AI recommendations, risk analysis, and audit trails
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Decision Review</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <DecisionReviewDashboard />
        </TabsContent>
        
        <TabsContent value="risk" className="mt-6">
          <RiskScoreVisualization />
        </TabsContent>
        
        <TabsContent value="evidence" className="mt-6">
          <EvidenceViewer />
        </TabsContent>
        
        <TabsContent value="audit" className="mt-6">
          <AuditTrail />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Decisions;