import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, FileText, Lock, Target, Eye, AlertTriangle, CheckCircle2, Zap, Brain } from 'lucide-react';

interface ScoreModalProps {
  open: boolean;
  onClose: () => void;
}

const scoringBands = [
  {
    range: '0-30',
    name: 'Blocked',
    color: 'bg-muted text-muted-foreground',
    description: 'Critical gaps prevent AI deployment',
    icon: AlertTriangle
  },
  {
    range: '31-60',
    name: 'Cautious',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    description: 'Foundation needs work before scaling',
    icon: Eye
  },
  {
    range: '61-80',
    name: 'Enabled',
    color: 'bg-brand-teal/10 text-brand-teal',
    description: 'Strong compliance posture for deployment',
    icon: CheckCircle2
  },
  {
    range: '81-100',
    name: 'Native',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    description: 'Audit-ready AI operations at scale',
    icon: Zap
  }
];

const assessmentDomains = [
  {
    name: 'Data Governance & Privacy',
    icon: Shield,
    description: 'Data classification, privacy controls, and retention policies'
  },
  {
    name: 'Human-in-the-Loop Controls',
    icon: Users,
    description: 'Human oversight, escalation procedures, and review processes'
  },
  {
    name: 'Audit Trail & Documentation',
    icon: FileText,
    description: 'Decision logging, model documentation, and audit accessibility'
  },
  {
    name: 'Security & Access Controls',
    icon: Lock,
    description: 'Role-based access, model protection, and security assessments'
  },
  {
    name: 'Model Validation & Testing',
    icon: Target,
    description: 'Testing frameworks, bias detection, and performance monitoring'
  },
  {
    name: 'Risk Assessment & Monitoring',
    icon: Eye,
    description: 'Risk identification, impact assessment, and continuous monitoring'
  },
  {
    name: 'Vendor Management',
    icon: Users,
    description: 'Third-party AI services, vendor assessment, and compliance'
  },
  {
    name: 'Regulatory Compliance',
    icon: Shield,
    description: 'Industry regulations, compliance frameworks, and reporting'
  },
  {
    name: 'Incident Response',
    icon: AlertTriangle,
    description: 'Incident detection, response procedures, and remediation'
  },
  {
    name: 'Training & Awareness',
    icon: Brain,
    description: 'Staff training, awareness programs, and competency assessment'
  }
];

const mustPassGates = [
  'Data Governance & Privacy',
  'Human-in-the-Loop Controls', 
  'Audit Trail & Documentation',
  'Security & Access Controls'
];

export function ScoreModal({ open, onClose }: ScoreModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">How the AI Acceleration Score Works</DialogTitle>
          <DialogDescription>
            Understanding the assessment methodology and scoring bands
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Scoring Bands */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Scoring Bands</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {scoringBands.map((band, index) => {
                const Icon = band.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className="w-5 h-5" />
                        <Badge className={band.color}>
                          {band.name} ({band.range})
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {band.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Must-Pass Gate Icons */}
            <div className="mt-6 p-4 bg-brand-teal/5 border border-brand-teal/20 rounded-lg">
              <h4 className="font-medium text-brand-teal mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Four Must-Pass Gates for Band Progression
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">Data & Privacy</p>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">Human-in-Loop</p>
                </div>
                <div className="text-center">
                  <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">Audit Trail</p>
                </div>
                <div className="text-center">
                  <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">Security</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Each gate must score ≥2.0 average to advance beyond Cautious (60+)
              </p>
            </div>
          </div>
          
          {/* Assessment Domains */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Assessment Domains</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your organization is evaluated across 10 key domains of AI governance and compliance.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {assessmentDomains.map((domain, index) => {
                const Icon = domain.icon;
                const isMustPass = mustPassGates.includes(domain.name);
                
                return (
                  <div 
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      isMustPass ? 'border-brand-teal/30 bg-brand-teal/5' : 'border-border'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isMustPass ? 'text-brand-teal' : 'text-muted-foreground'}`} />
                    <div>
                      <h4 className="font-medium text-sm flex items-center">
                        {domain.name}
                        {isMustPass && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Must-Pass
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {domain.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Must-Pass Gates */}
          <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-lg p-4">
            <h3 className="font-semibold text-brand-teal mb-2">Must-Pass Gates</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Organizations must achieve a minimum score in these critical domains to advance beyond the Cautious band (60+ score):
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {mustPassGates.map((gate, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{gate}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Methodology */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Assessment Methodology</h3>
            <div className="space-y-4 text-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Likert Scale</h4>
                    <p className="text-xs text-muted-foreground">
                      0-5 rating system from "Not at all" to "Fully operational"
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Evidence Based</h4>
                    <p className="text-xs text-muted-foreground">
                      Optional evidence attachment increases confidence score
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Gate Validation</h4>
                    <p className="text-xs text-muted-foreground">
                      Must-pass gates ensure minimum compliance baseline
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}