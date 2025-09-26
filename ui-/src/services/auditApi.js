// Mock API service for audit trail data
// This simulates the /api/dashboard/audit-trail/:orgId endpoint

const mockAuditData = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    user: 'john.doe@company.com',
    action: 'Policy Decision Approved',
    decisionType: 'policy',
    status: 'approved',
    rationale: 'Content complies with FDA social media guidelines. No violations detected in promotional language or claims.',
    policyReferences: ['FDA-SM-001', 'SOCIAL-MEDIA-POLICY'],
    details: {
      confidence_score: 0.95,
      compliance_score: 0.98,
      risk_level: 'low',
      processing_time_ms: 1200
    }
  },
  {
    id: '2',
    timestamp: '2024-01-15T09:15:00Z',
    user: 'sarah.smith@company.com',
    action: 'Risk Assessment Completed',
    decisionType: 'risk',
    status: 'review',
    rationale: 'Potential compliance risk identified in promotional content. Requires human review for final approval.',
    policyReferences: ['RISK-ASSESSMENT-001', 'COMPLIANCE-CHECK'],
    details: {
      confidence_score: 0.78,
      compliance_score: 0.85,
      risk_level: 'medium',
      processing_time_ms: 2100
    }
  },
  {
    id: '3',
    timestamp: '2024-01-15T08:45:00Z',
    user: 'ai-system',
    action: 'Automated Compliance Check',
    decisionType: 'compliance',
    status: 'approved',
    rationale: 'Automated review completed. All content elements meet regulatory requirements.',
    policyReferences: ['AUTO-COMPLIANCE-001'],
    details: {
      confidence_score: 0.92,
      compliance_score: 0.94,
      risk_level: 'low',
      processing_time_ms: 850
    }
  },
  {
    id: '4',
    timestamp: '2024-01-14T16:20:00Z',
    user: 'mike.wilson@company.com',
    action: 'Policy Violation Detected',
    decisionType: 'audit',
    status: 'rejected',
    rationale: 'Content contains unapproved promotional claims that violate FDA guidelines. Immediate action required.',
    policyReferences: ['FDA-VIOLATION-001', 'EMERGENCY-PROTOCOL'],
    details: {
      confidence_score: 0.99,
      compliance_score: 0.45,
      risk_level: 'high',
      processing_time_ms: 1500
    }
  },
  {
    id: '5',
    timestamp: '2024-01-14T14:30:00Z',
    user: 'lisa.chen@company.com',
    action: 'Social Media Post Reviewed',
    decisionType: 'policy',
    status: 'approved',
    rationale: 'Post content is appropriate and follows all company social media guidelines.',
    policyReferences: ['SOCIAL-MEDIA-POLICY', 'BRAND-GUIDELINES'],
    details: {
      confidence_score: 0.88,
      compliance_score: 0.91,
      risk_level: 'low',
      processing_time_ms: 950
    }
  },
  {
    id: '6',
    timestamp: '2024-01-14T11:15:00Z',
    user: 'ai-system',
    action: 'Content Moderation Applied',
    decisionType: 'compliance',
    status: 'approved',
    rationale: 'AI-powered content moderation successfully identified and flagged inappropriate content.',
    policyReferences: ['AI-MODERATION-001'],
    details: {
      confidence_score: 0.96,
      compliance_score: 0.97,
      risk_level: 'low',
      processing_time_ms: 650
    }
  },
  {
    id: '7',
    timestamp: '2024-01-14T09:45:00Z',
    user: 'david.brown@company.com',
    action: 'Regulatory Update Applied',
    decisionType: 'policy',
    status: 'approved',
    rationale: 'Updated policy rules to reflect latest FDA guidance on social media communications.',
    policyReferences: ['FDA-UPDATE-2024', 'POLICY-UPDATE-001'],
    details: {
      confidence_score: 0.85,
      compliance_score: 0.89,
      risk_level: 'medium',
      processing_time_ms: 1800
    }
  },
  {
    id: '8',
    timestamp: '2024-01-13T17:20:00Z',
    user: 'ai-system',
    action: 'Automated Policy Enforcement',
    decisionType: 'compliance',
    status: 'approved',
    rationale: 'Automated system enforced policy rules and prevented non-compliant content from being published.',
    policyReferences: ['AUTO-ENFORCEMENT-001'],
    details: {
      confidence_score: 0.94,
      compliance_score: 0.96,
      risk_level: 'low',
      processing_time_ms: 720
    }
  }
];

export const auditApi = {
  // Mock function to simulate API call
  getAuditTrail: async (organizationId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate organization filtering
    const filteredData = mockAuditData.filter(entry => 
      entry.organizationId === organizationId || organizationId === 'demo-org-123'
    );
    
    return {
      success: true,
      auditTrail: filteredData,
      total: filteredData.length,
      organizationId
    };
  },

  // Mock function to get audit statistics
  getAuditStats: async (organizationId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stats = {
      totalEntries: mockAuditData.length,
      approvedCount: mockAuditData.filter(e => e.status === 'approved').length,
      rejectedCount: mockAuditData.filter(e => e.status === 'rejected').length,
      pendingCount: mockAuditData.filter(e => e.status === 'pending').length,
      reviewCount: mockAuditData.filter(e => e.status === 'review').length,
      averageConfidence: mockAuditData.reduce((sum, e) => sum + (e.details?.confidence_score || 0), 0) / mockAuditData.length,
      averageCompliance: mockAuditData.reduce((sum, e) => sum + (e.details?.compliance_score || 0), 0) / mockAuditData.length
    };
    
    return {
      success: true,
      stats
    };
  }
};

// Override fetch for demo purposes
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Intercept audit trail API calls
  if (url.includes('/api/dashboard/audit-trail/')) {
    const organizationId = url.split('/').pop();
    return auditApi.getAuditTrail(organizationId).then(data => ({
      ok: true,
      json: () => Promise.resolve(data)
    }));
  }
  
  // Pass through other requests
  return originalFetch(url, options);
}; 