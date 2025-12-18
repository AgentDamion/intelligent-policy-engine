import { useState, useEffect } from 'react';

export interface MaturityDimension {
  id: string;
  name: string;
  description: string;
  score: number;
  maxScore: number;
  status: 'critical' | 'needs-work' | 'good' | 'excellent';
  recommendations: string[];
  keyAreas: {
    name: string;
    score: number;
    status: 'critical' | 'needs-work' | 'good' | 'excellent';
  }[];
}

export interface ReadinessOverviewData {
  overallScore: number;
  maxScore: number;
  readinessLevel: 'foundation' | 'developing' | 'advanced' | 'native';
  completionRate: number;
  lastAssessment: string;
  nextRecommendedAction: string;
  dimensions: MaturityDimension[];
}

export interface PreWorkGuide {
  id: string;
  title: string;
  category: 'governance' | 'technical' | 'cultural' | 'operational';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  description: string;
  steps: string[];
  resources: {
    type: 'document' | 'video' | 'template' | 'checklist';
    title: string;
    url: string;
  }[];
  progress: number;
  isCompleted: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  dueDate: string;
  estimatedEffort: string;
  description: string;
  assignedTo?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  dependencies: string[];
}

export function useAIReadinessData() {
  const [data, setData] = useState<ReadinessOverviewData | null>(null);
  const [guides, setGuides] = useState<PreWorkGuide[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadData = () => {
      const mockData: ReadinessOverviewData = {
        overallScore: 67,
        maxScore: 100,
        readinessLevel: 'developing',
        completionRate: 72,
        lastAssessment: '2024-01-15',
        nextRecommendedAction: 'Complete governance framework documentation',
        dimensions: [
          {
            id: 'governance',
            name: 'Governance & Policy',
            description: 'AI governance framework, policies, and oversight structures',
            score: 75,
            maxScore: 100,
            status: 'good',
            recommendations: [
              'Establish AI steering committee',
              'Document approval workflows',
              'Create risk assessment templates'
            ],
            keyAreas: [
              { name: 'Policy Framework', score: 80, status: 'good' },
              { name: 'Approval Process', score: 70, status: 'good' },
              { name: 'Risk Management', score: 75, status: 'good' }
            ]
          },
          {
            id: 'technical',
            name: 'Technical Infrastructure',
            description: 'Technical capabilities for AI implementation and monitoring',
            score: 45,
            maxScore: 100,
            status: 'needs-work',
            recommendations: [
              'Implement model monitoring system',
              'Set up audit trail infrastructure',
              'Establish testing frameworks'
            ],
            keyAreas: [
              { name: 'MLOps Pipeline', score: 40, status: 'needs-work' },
              { name: 'Monitoring & Alerts', score: 35, status: 'critical' },
              { name: 'Security Controls', score: 60, status: 'needs-work' }
            ]
          },
          {
            id: 'human-capital',
            name: 'Human Capital',
            description: 'Skills, training, and organizational capabilities',
            score: 82,
            maxScore: 100,
            status: 'excellent',
            recommendations: [
              'Expand AI ethics training',
              'Cross-train domain experts',
              'Develop change management plan'
            ],
            keyAreas: [
              { name: 'AI Literacy', score: 85, status: 'excellent' },
              { name: 'Technical Skills', score: 78, status: 'good' },
              { name: 'Change Management', score: 83, status: 'excellent' }
            ]
          },
          {
            id: 'cultural',
            name: 'Cultural Readiness',
            description: 'Organizational culture and change readiness for AI adoption',
            score: 68,
            maxScore: 100,
            status: 'good',
            recommendations: [
              'Address AI adoption concerns',
              'Improve cross-team collaboration',
              'Strengthen innovation mindset'
            ],
            keyAreas: [
              { name: 'Innovation Culture', score: 72, status: 'good' },
              { name: 'Risk Appetite', score: 65, status: 'good' },
              { name: 'Collaboration', score: 67, status: 'good' }
            ]
          },
          {
            id: 'operational',
            name: 'Operational Excellence',
            description: 'Processes, procedures, and operational maturity',
            score: 55,
            maxScore: 100,
            status: 'needs-work',
            recommendations: [
              'Standardize AI workflows',
              'Implement quality controls',
              'Establish performance metrics'
            ],
            keyAreas: [
              { name: 'Process Maturity', score: 58, status: 'needs-work' },
              { name: 'Quality Assurance', score: 52, status: 'needs-work' },
              { name: 'Performance Management', score: 55, status: 'needs-work' }
            ]
          },
          {
            id: 'business-integration',
            name: 'Business Integration',
            description: 'Strategic alignment and business value realization',
            score: 71,
            maxScore: 100,
            status: 'good',
            recommendations: [
              'Define AI ROI metrics',
              'Align with strategic goals',
              'Improve stakeholder engagement'
            ],
            keyAreas: [
              { name: 'Strategic Alignment', score: 75, status: 'good' },
              { name: 'Value Measurement', score: 68, status: 'good' },
              { name: 'Stakeholder Buy-in', score: 70, status: 'good' }
            ]
          }
        ]
      };

      const mockGuides: PreWorkGuide[] = [
        {
          id: 'governance-framework',
          title: 'AI Governance Framework Setup',
          category: 'governance',
          difficulty: 'intermediate',
          duration: '2-3 weeks',
          description: 'Establish comprehensive AI governance framework with policies and oversight',
          steps: [
            'Define AI governance charter',
            'Establish steering committee',
            'Create policy templates',
            'Set up approval workflows'
          ],
          resources: [
            { type: 'template', title: 'AI Governance Charter Template', url: '#' },
            { type: 'document', title: 'Best Practices Guide', url: '#' },
            { type: 'checklist', title: 'Implementation Checklist', url: '#' }
          ],
          progress: 65,
          isCompleted: false
        },
        {
          id: 'technical-infrastructure',
          title: 'MLOps Infrastructure Setup',
          category: 'technical',
          difficulty: 'advanced',
          duration: '4-6 weeks',
          description: 'Implement technical infrastructure for AI model deployment and monitoring',
          steps: [
            'Set up model registry',
            'Implement CI/CD pipeline',
            'Configure monitoring systems',
            'Establish testing frameworks'
          ],
          resources: [
            { type: 'document', title: 'MLOps Architecture Guide', url: '#' },
            { type: 'template', title: 'Pipeline Configuration', url: '#' },
            { type: 'video', title: 'Setup Walkthrough', url: '#' }
          ],
          progress: 25,
          isCompleted: false
        },
        {
          id: 'risk-assessment',
          title: 'AI Risk Assessment Framework',
          category: 'governance',
          difficulty: 'intermediate',
          duration: '1-2 weeks',
          description: 'Develop systematic approach to AI risk identification and mitigation',
          steps: [
            'Define risk categories',
            'Create assessment templates',
            'Establish risk thresholds',
            'Implement review process'
          ],
          resources: [
            { type: 'template', title: 'Risk Assessment Template', url: '#' },
            { type: 'checklist', title: 'Risk Mitigation Checklist', url: '#' },
            { type: 'document', title: 'Risk Framework Guide', url: '#' }
          ],
          progress: 80,
          isCompleted: false
        }
      ];

      const mockActionItems: ActionItem[] = [
        {
          id: 'action-1',
          title: 'Complete governance documentation',
          priority: 'high',
          category: 'Governance',
          dueDate: '2024-02-15',
          estimatedEffort: '2 weeks',
          description: 'Finalize AI governance charter and policy documents',
          status: 'in-progress',
          dependencies: []
        },
        {
          id: 'action-2',
          title: 'Set up model monitoring system',
          priority: 'critical',
          category: 'Technical',
          dueDate: '2024-02-01',
          estimatedEffort: '3 weeks',
          description: 'Implement comprehensive model performance monitoring',
          assignedTo: 'DevOps Team',
          status: 'not-started',
          dependencies: ['action-1']
        },
        {
          id: 'action-3',
          title: 'Conduct staff AI training',
          priority: 'medium',
          category: 'Human Capital',
          dueDate: '2024-03-01',
          estimatedEffort: '1 week',
          description: 'Deliver AI literacy training to all relevant staff',
          status: 'not-started',
          dependencies: []
        }
      ];

      setData(mockData);
      setGuides(mockGuides);
      setActionItems(mockActionItems);
      setLoading(false);
    };

    // Simulate loading delay
    setTimeout(loadData, 1000);
  }, []);

  const updateProgress = (guideId: string, progress: number) => {
    setGuides(prev => prev.map(guide => 
      guide.id === guideId 
        ? { ...guide, progress, isCompleted: progress === 100 }
        : guide
    ));
  };

  const updateActionStatus = (actionId: string, status: ActionItem['status']) => {
    setActionItems(prev => prev.map(item =>
      item.id === actionId ? { ...item, status } : item
    ));
  };

  return {
    data,
    guides,
    actionItems,
    loading,
    updateProgress,
    updateActionStatus
  };
}