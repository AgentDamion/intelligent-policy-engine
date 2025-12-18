import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  FileText,
  Shield,
  Database,
  Key,
  Users,
  Settings,
  Play,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: 'records' | 'security' | 'validation' | 'audit' | 'training';
  status: 'passed' | 'warning' | 'failed' | 'pending';
  priority: 'critical' | 'high' | 'medium' | 'low';
  regulation: string;
  evidence?: string;
  recommendation?: string;
  timeline?: string;
  icon: React.ComponentType<any>;
}

const complianceItems: ComplianceItem[] = [
  {
    id: 'cfr-part-11',
    title: '21 CFR Part 11 Electronic Records',
    description: 'Electronic records and signatures must be trustworthy, reliable, and equivalent to paper records.',
    category: 'records',
    status: 'passed',
    priority: 'critical',
    regulation: '21 CFR Part 11.10',
    evidence: 'Cryptographic signatures verified',
    icon: FileText
  },
  {
    id: 'data-integrity',
    title: 'Data Integrity Controls',
    description: 'ALCOA+ principles implemented for all AI-generated data and decisions.',
    category: 'security',
    status: 'passed',
    priority: 'critical',
    regulation: 'FDA Data Integrity Guidance',
    evidence: 'Immutable audit trail active',
    icon: Database
  },
  {
    id: 'bias-testing',
    title: 'AI Bias Testing Protocol',
    description: 'Systematic evaluation of AI models for demographic and clinical bias.',
    category: 'validation',
    status: 'warning',
    priority: 'high',
    regulation: 'FDA AI/ML Guidance',
    recommendation: 'Complete quarterly bias assessment',
    timeline: '14 days remaining',
    icon: AlertTriangle
  },
  {
    id: 'audit-trail',
    title: 'Complete Audit Trail',
    description: 'Comprehensive logging of all AI decisions, model changes, and user interactions.',
    category: 'audit',
    status: 'passed',
    priority: 'critical',
    regulation: '21 CFR Part 11.10(e)',
    evidence: 'Real-time audit trail validated',
    icon: Shield
  },
  {
    id: 'access-controls',
    title: 'Role-Based Access Controls',
    description: 'Proper user authentication and authorization for AI system access.',
    category: 'security',
    status: 'passed',
    priority: 'high',
    regulation: '21 CFR Part 11.10(d)',
    evidence: 'Multi-factor authentication enabled',
    icon: Key
  },
  {
    id: 'validation-docs',
    title: 'AI Model Validation Documentation',
    description: 'Comprehensive validation package for all AI models in clinical use.',
    category: 'validation',
    status: 'warning',
    priority: 'high',
    regulation: 'ICH Q2/Q3 Guidelines',
    recommendation: 'Update validation protocols',
    timeline: '21 days remaining',
    icon: FileText
  },
  {
    id: 'training-records',
    title: 'Personnel Training Records',
    description: 'Documentation of AI system training for all authorized users.',
    category: 'training',
    status: 'passed',
    priority: 'medium',
    regulation: '21 CFR Part 11.10(i)',
    evidence: 'Training completed for 98% of users',
    icon: Users
  },
  {
    id: 'change-control',
    title: 'AI Model Change Control',
    description: 'Formal change control process for AI model updates and deployments.',
    category: 'validation',
    status: 'failed',
    priority: 'critical',
    regulation: 'FDA Software Validation',
    recommendation: 'Implement formal change control procedure',
    timeline: 'Immediate action required',
    icon: Settings
  }
];

interface InteractiveComplianceChecklistProps {
  showDetails?: boolean;
  allowExpansion?: boolean;
  filterByCategory?: string[];
  showProgress?: boolean;
}

const InteractiveComplianceChecklist: React.FC<InteractiveComplianceChecklistProps> = ({
  showDetails = true,
  allowExpansion = true,
  filterByCategory,
  showProgress = true
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animateProgress, setAnimateProgress] = useState(false);

  const categories = {
    all: { label: 'All Items', icon: Shield, count: complianceItems.length },
    records: { label: 'Electronic Records', icon: FileText, count: 0 },
    security: { label: 'Security Controls', icon: Key, count: 0 },
    validation: { label: 'Validation', icon: Database, count: 0 },
    audit: { label: 'Audit Trail', icon: Shield, count: 0 },
    training: { label: 'Training', icon: Users, count: 0 }
  };

  // Calculate category counts
  Object.keys(categories).forEach(cat => {
    if (cat !== 'all') {
      categories[cat].count = complianceItems.filter(item => item.category === cat).length;
    }
  });

  const filteredItems = filterByCategory 
    ? complianceItems.filter(item => filterByCategory.includes(item.category))
    : selectedCategory === 'all' 
      ? complianceItems 
      : complianceItems.filter(item => item.category === selectedCategory);

  const statusCounts = {
    passed: filteredItems.filter(item => item.status === 'passed').length,
    warning: filteredItems.filter(item => item.status === 'warning').length,
    failed: filteredItems.filter(item => item.status === 'failed').length,
    pending: filteredItems.filter(item => item.status === 'pending').length
  };

  const overallProgress = Math.round((statusCounts.passed / filteredItems.length) * 100);

  useEffect(() => {
    setAnimateProgress(true);
  }, [selectedCategory]);

  const toggleExpanded = (itemId: string) => {
    if (!allowExpansion) return;
    
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'failed': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-success';
      case 'warning': return 'text-warning';
      case 'failed': return 'text-destructive';
      case 'pending': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/15 text-destructive border-destructive/20';
      case 'high': return 'bg-warning/15 text-warning border-warning/20';
      case 'medium': return 'bg-primary/15 text-primary border-primary/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {showProgress && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              FDA Compliance Status
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm" variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Run Assessment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Compliance</span>
                <span className="text-lg font-semibold text-foreground">{overallProgress}%</span>
              </div>
              <Progress 
                value={animateProgress ? overallProgress : 0} 
                className="h-3 mb-4"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="text-2xl font-bold text-success">{statusCounts.passed}</div>
                  <div className="text-xs text-muted-foreground">Compliant</div>
                </div>
                <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="text-2xl font-bold text-warning">{statusCounts.warning}</div>
                  <div className="text-xs text-muted-foreground">Needs Review</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Critical Items</h4>
              {filteredItems.filter(item => item.priority === 'critical').map(item => {
                const StatusIcon = getStatusIcon(item.status);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <StatusIcon className={`w-4 h-4 ${getStatusColor(item.status)}`} />
                    <span className="text-sm flex-1">{item.title}</span>
                    {item.timeline && item.status !== 'passed' && (
                      <Badge variant="outline" className="text-xs">
                        {item.timeline}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      {!filterByCategory && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categories).map(([key, category]) => {
            const CategoryIcon = category.icon;
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="flex items-center gap-2"
              >
                <CategoryIcon className="w-4 h-4" />
                {category.label}
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      )}

      {/* Compliance Items List */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const StatusIcon = getStatusIcon(item.status);
          const ItemIcon = item.icon;
          const isExpanded = expandedItems.has(item.id);

          return (
            <motion.div
              key={item.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div 
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  allowExpansion ? 'cursor-pointer' : ''
                }`}
                onClick={() => toggleExpanded(item.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <ItemIcon className="w-5 h-5 text-muted-foreground" />
                      <StatusIcon className={`w-4 h-4 ${getStatusColor(item.status)} absolute -bottom-1 -right-1`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(item.priority)}
                        >
                          {item.priority}
                        </Badge>
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(item.status)}`} />
                      </div>
                    </div>

                    {item.timeline && item.status !== 'passed' && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-warning" />
                        <span className="text-warning">{item.timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Regulatory Reference</h5>
                          <p className="text-sm text-muted-foreground">{item.regulation}</p>
                        </div>
                        
                        {item.evidence && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2">Evidence</h5>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-success" />
                              <span className="text-sm text-success">{item.evidence}</span>
                            </div>
                          </div>
                        )}
                        
                        {item.recommendation && (
                          <div className="md:col-span-2">
                            <h5 className="font-medium text-foreground mb-2">Recommendation</h5>
                            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded border border-warning/20">
                              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                              <span className="text-sm text-warning">{item.recommendation}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          View Documentation
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          FDA Guidance
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveComplianceChecklist;