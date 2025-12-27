import express from 'express';
const router = express.Router();

// In-memory storage for demo (use database in production)
const submissionsDb = new Map();
let submissionCounter = 1;

// Helper to generate submission ID
const generateId = () => `ts_${Date.now()}_${submissionCounter++}`;

// Helper to create default submission
const createDefaultSubmission = (id) => ({
  id,
  status: 'draft',
  updatedAt: new Date().toISOString(),
  tool: {
    name: '',
    vendor: '',
    version: '',
    category: '',
    site: '',
    license: '',
    costUsd: 0,
    description: ''
  },
  model: {
    type: '',
    description: '',
    trainingData: '',
    useTags: []
  },
  purpose: {
    description: '',
    handlesPersonalData: false,
    generatesRegulatedContent: false,
    attachments: [],
    businessJustification: '',
    expectedUsers: 0,
    departments: []
  },
  privacy: {
    dataTypes: [],
    retentionPeriod: '',
    geographicRestrictions: [],
    complianceFrameworks: []
  },
  evidence: {
    files: []
  },
  tech: {
    hosting: '',
    dataFlow: '',
    integrations: [],
    securityRequirements: []
  },
  risk: {
    level: 'low',
    knownRisks: '',
    mitigations: '',
    regulatoryRequirements: []
  },
  vendor: {
    contact: '',
    securityPage: '',
    certs: [],
    contractTerms: '',
    supportLevel: ''
  },
  approval: {
    reviewers: [],
    conditions: [],
    timeline: '',
    escalationPath: []
  },
  attest: false,
  finalComments: ''
});

// Create new submission
router.post('/submissions', (req, res) => {
  try {
    const id = generateId();
    const submission = createDefaultSubmission(id);
    submissionsDb.set(id, submission);
    
    console.log(`[Tools API] Created submission: ${id}`);
    res.json({ id });
  } catch (error) {
    console.error('[Tools API] Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Get submission by ID
router.get('/submissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const submission = submissionsDb.get(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    console.log(`[Tools API] Retrieved submission: ${id}`);
    res.json(submission);
  } catch (error) {
    console.error('[Tools API] Error retrieving submission:', error);
    res.status(500).json({ error: 'Failed to retrieve submission' });
  }
});

// Update submission (partial update)
router.patch('/submissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const submission = submissionsDb.get(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Deep merge the update
    const updatedSubmission = {
      ...submission,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    submissionsDb.set(id, updatedSubmission);
    
    console.log(`[Tools API] Updated submission: ${id}`);
    res.json({ ok: true });
  } catch (error) {
    console.error('[Tools API] Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Submit submission for review
router.post('/submissions/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const submission = submissionsDb.get(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    submission.status = 'submitted';
    submission.updatedAt = new Date().toISOString();
    submissionsDb.set(id, submission);
    
    console.log(`[Tools API] Submitted for review: ${id}`);
    res.json({ ok: true, status: 'submitted' });
  } catch (error) {
    console.error('[Tools API] Error submitting:', error);
    res.status(500).json({ error: 'Failed to submit submission' });
  }
});

// Meta-Loop Pre-Analysis
router.post('/intel/metaloop/precheck', (req, res) => {
  try {
    const { tool = {}, model = {}, purpose = {}, risk = {} } = req.body || {};
    
    // Simulate analysis based on submission data
    const risks = [];
    let overallRisk = 'low';
    const recommendations = [];
    const complianceGaps = [];
    
    // Bias risk assessment
    if (model.type === 'vision' || model.type === 'multimodal') {
      risks.push({
        key: 'bias',
        label: 'Algorithmic Bias Risk',
        severity: 'high',
        rationale: 'Vision and multimodal models require extensive bias evaluation for visual recognition tasks.'
      });
      overallRisk = 'high';
      recommendations.push('Conduct comprehensive bias testing across demographic groups.');
      complianceGaps.push('Bias assessment documentation required.');
    } else if (model.type === 'llm') {
      risks.push({
        key: 'bias',
        label: 'Language Model Bias',
        severity: 'medium',
        rationale: 'Language models may exhibit bias in generated content.'
      });
      recommendations.push('Implement bias detection in model outputs.');
    }
    
    // PII handling assessment
    if (purpose.handlesPersonalData) {
      risks.push({
        key: 'pii',
        label: 'Personal Data Handling',
        severity: 'high',
        rationale: 'Personal data processing requires strict compliance controls.'
      });
      overallRisk = 'high';
      recommendations.push('Ensure data processing agreement (DPA) is in place.');
      recommendations.push('Implement data minimization and retention policies.');
      complianceGaps.push('GDPR compliance documentation needed.');
    }
    
    // Regulatory content assessment
    if (purpose.generatesRegulatedContent) {
      risks.push({
        key: 'regulatory',
        label: 'Regulated Content Generation',
        severity: 'medium',
        rationale: 'Generated content in regulated industries requires review processes.'
      });
      if (overallRisk === 'low') overallRisk = 'medium';
      recommendations.push('Implement content review workflows.');
    }
    
    // Tool category specific risks
    if (tool.category === 'generative-ai') {
      risks.push({
        key: 'hallucination',
        label: 'Content Accuracy Risk',
        severity: 'medium',
        rationale: 'Generative AI tools may produce inaccurate or fabricated information.'
      });
      recommendations.push('Implement fact-checking and validation processes.');
    }
    
    // Default risk if none identified
    if (risks.length === 0) {
      risks.push({
        key: 'general',
        label: 'General AI Risk',
        severity: 'low',
        rationale: 'Standard AI governance and monitoring applies.'
      });
      recommendations.push('Follow standard AI governance policies.');
    }
    
    const confidence = Math.random() * 0.3 + 0.7; // 70-100%
    
    const result = {
      risks,
      confidence,
      recommendations,
      overallRisk,
      complianceGaps
    };
    
    console.log(`[Tools API] Generated precheck analysis:`, result);
    res.json(result);
  } catch (error) {
    console.error('[Tools API] Error in precheck:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Policy hints based on category
router.get('/policies/hints', (req, res) => {
  try {
    const { category } = req.query;
    
    const allHints = [
      {
        id: 'ph1',
        title: 'AI Clinical Trial Data Privacy Policy',
        body: 'All generative models used in clinical contexts must include bias testing evidence and patient data protection measures.',
        relevance: 0.9,
        category: 'generative-ai',
        required: true
      },
      {
        id: 'ph2',
        title: 'PII Data Handling Requirements',
        body: 'If personal data is processed, add Data Processing Agreement (DPA) and retention mapping documentation.',
        relevance: 0.8,
        category: 'data-analytics',
        required: true
      },
      {
        id: 'ph3',
        title: 'Machine Learning Model Validation',
        body: 'ML algorithms require validation documentation including training data sources, model performance metrics, and bias evaluation.',
        relevance: 0.85,
        category: 'machine-learning',
        required: true
      },
      {
        id: 'ph4',
        title: 'Automated Decision Making Governance',
        body: 'Tools that make automated decisions affecting individuals must include explainability and appeal processes.',
        relevance: 0.7,
        category: 'automation',
        required: false
      },
      {
        id: 'ph5',
        title: 'Computer Vision Bias Assessment',
        body: 'Vision models must be tested across diverse demographic groups and use cases to identify potential bias.',
        relevance: 0.9,
        category: 'computer-vision',
        required: true
      },
      {
        id: 'ph6',
        title: 'Natural Language Processing Ethics',
        body: 'NLP tools require content filtering, bias detection, and harmful content prevention measures.',
        relevance: 0.75,
        category: 'natural-language',
        required: false
      }
    ];
    
    let filteredHints = allHints;
    if (category) {
      filteredHints = allHints.filter(hint => 
        hint.category === category || hint.category === 'general'
      );
    }
    
    // Sort by relevance
    filteredHints.sort((a, b) => b.relevance - a.relevance);
    
    console.log(`[Tools API] Retrieved policy hints for category: ${category || 'all'}`);
    res.json(filteredHints);
  } catch (error) {
    console.error('[Tools API] Error retrieving policy hints:', error);
    res.status(500).json({ error: 'Failed to retrieve policy hints' });
  }
});

// File upload (mock signed URL)
router.post('/uploads/signed-url', (req, res) => {
  try {
    const { name, type } = req.body;
    const key = `uploads/${Date.now()}_${name || 'file.bin'}`;
    
    // In a real implementation, this would generate a signed URL for S3/similar
    const mockUrl = `https://example-bucket.s3.amazonaws.com/${key}?signed=true`;
    
    console.log(`[Tools API] Generated signed URL for: ${name}`);
    res.json({ 
      url: mockUrl, 
      key 
    });
  } catch (error) {
    console.error('[Tools API] Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// List all submissions (for admin/debug)
router.get('/submissions', (req, res) => {
  try {
    const submissions = Array.from(submissionsDb.values());
    res.json(submissions);
  } catch (error) {
    console.error('[Tools API] Error listing submissions:', error);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

export default router;
