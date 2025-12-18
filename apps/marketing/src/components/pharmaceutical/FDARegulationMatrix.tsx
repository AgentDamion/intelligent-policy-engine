import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Shield, Eye, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RegulationItem {
  id: string;
  title: string;
  description: string;
  requirement: string;
  implementation: string;
  status: 'complete' | 'in-progress' | 'pending';
  evidence?: string[];
}

const regulations: RegulationItem[] = [
  {
    id: '21cfr11',
    title: '21 CFR Part 11',
    description: 'Electronic Records & Electronic Signatures',
    requirement: 'Secure electronic record keeping with audit trails and electronic signatures',
    implementation: 'Cryptographic signing, immutable audit logs, user authentication',
    status: 'complete',
    evidence: ['Digital signatures', 'Audit trail exports', 'Access controls']
  },
  {
    id: 'data-integrity',
    title: 'Data Integrity Controls',
    description: 'ALCOA+ Principles (Attributable, Legible, Contemporaneous, Original, Accurate)',
    requirement: 'Ensure data integrity throughout the AI lifecycle',
    implementation: 'Version control, change tracking, automated validation',
    status: 'complete',
    evidence: ['Version history', 'Change logs', 'Validation reports']
  },
  {
    id: 'bias-testing',
    title: 'AI Bias Assessment',
    description: 'Testing for bias and fairness in AI models',
    requirement: 'Regular bias testing and mitigation strategies',
    implementation: 'Automated bias detection, fairness metrics, demographic analysis',
    status: 'in-progress',
    evidence: ['Bias reports', 'Fairness assessments']
  },
  {
    id: 'samd-compliance',
    title: 'SaMD Classification',
    description: 'Software as Medical Device compliance',
    requirement: 'Proper classification and risk assessment for medical AI',
    implementation: 'Risk categorization, clinical validation, safety monitoring',
    status: 'pending',
    evidence: []
  }
];

export const FDARegulationMatrix: React.FC = () => {
  const [selectedRegulation, setSelectedRegulation] = useState<string | null>(null);

  const getStatusColor = (status: RegulationItem['status']) => {
    switch (status) {
      case 'complete': return 'text-green-600';
      case 'in-progress': return 'text-yellow-600';
      case 'pending': return 'text-red-600';
    }
  };

  const getStatusBadge = (status: RegulationItem['status']) => {
    const variants = {
      complete: 'default',
      'in-progress': 'secondary',
      pending: 'destructive'
    } as const;

    const labels = {
      complete: 'Compliant',
      'in-progress': 'In Progress',
      pending: 'Pending'
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  const getCompletionPercentage = () => {
    const completed = regulations.filter(r => r.status === 'complete').length;
    return Math.round((completed / regulations.length) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>FDA Regulatory Compliance Matrix</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getCompletionPercentage()}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={getCompletionPercentage()} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regulations.map((regulation, index) => (
              <motion.div
                key={regulation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/30"
                  onClick={() => setSelectedRegulation(
                    selectedRegulation === regulation.id ? null : regulation.id
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm">{regulation.title}</h3>
                      {getStatusBadge(regulation.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {regulation.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {regulation.status === 'complete' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <span className={`text-xs font-medium ${getStatusColor(regulation.status)}`}>
                          {regulation.status === 'complete' ? 'Verified' : 
                           regulation.status === 'in-progress' ? 'Working' : 'Required'}
                        </span>
                      </div>
                      {regulation.evidence && regulation.evidence.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {regulation.evidence.length} Evidence
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedRegulation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              const regulation = regulations.find(r => r.id === selectedRegulation);
              if (!regulation) return null;

              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>{regulation.title} - Detailed View</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1 flex items-center">
                            <Shield className="h-4 w-4 mr-1 text-blue-600" />
                            What FDA Requires
                          </h4>
                          <p className="text-sm text-muted-foreground">{regulation.requirement}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1 flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                            How aicomplyr.io Delivers
                          </h4>
                          <p className="text-sm text-muted-foreground">{regulation.implementation}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center">
                            <Eye className="h-4 w-4 mr-1 text-purple-600" />
                            Available Evidence
                          </h4>
                          {regulation.evidence && regulation.evidence.length > 0 ? (
                            <div className="space-y-2">
                              {regulation.evidence.map((evidence, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">{evidence}</span>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No evidence available yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};