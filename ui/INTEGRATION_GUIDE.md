# AIComply.io Frontend Integration Guide

This guide explains how the new document processing and approval workflow components integrate with the existing Lovable frontend infrastructure.

## 🔗 **Integration Overview**

The new components are fully integrated with the existing Lovable frontend through:

1. **Unified API Service** (`/services/unified-api.ts`)
2. **Enhanced Hooks** (`/hooks/useUnifiedSubmission.ts`)
3. **Existing Infrastructure** (WebSocket, Auth, Database)
4. **Backward Compatibility** (All existing functionality preserved)

## 📁 **Integration Architecture**

```
Existing Lovable Frontend
├── services/
│   ├── api.ts                    # ✅ Existing base API
│   ├── tools.api.ts              # ✅ Existing tools API
│   ├── websocket.js              # ✅ Existing WebSocket
│   └── auth.api.ts               # ✅ Existing auth
├── components/
│   ├── existing components       # ✅ All preserved
│   └── new components/           # 🆕 New components
└── hooks/
    ├── existing hooks            # ✅ All preserved
    └── useUnifiedSubmission.ts   # 🆕 Enhanced hook

New Components (Fully Integrated)
├── document-processing/          # 🆕 Document processing
├── approval-workflow/            # 🆕 Approval workflow
├── compliance/                   # 🆕 Compliance scoring
├── audit/                        # 🆕 Audit trail
├── real-time/                    # 🆕 Live governance
└── reports/                      # 🆕 Export & reporting
```

## 🔌 **API Integration**

### **Existing API Services (Preserved)**
```typescript
// All existing services work exactly as before
import { 
  createSubmission, 
  fetchSubmission, 
  saveSubmission, 
  submitSubmission, 
  precheck, 
  policyHints 
} from '@/services/tools.api';

// WebSocket service unchanged
import webSocketService from '@/services/websocket';
```

### **New Unified API Service**
```typescript
// New unified API that combines everything
import { unifiedApi } from '@/services/unified-api';

// Access individual services
import { 
  documents,      // Document processing
  approvals,      // Approval workflow
  compliance,     // Compliance scoring
  audit,          // Audit trail
  governance,     // Live governance
  reports         // Export & reporting
} from '@/services/unified-api';
```

### **Enhanced Tool Submission API**
```typescript
// Enhanced methods that integrate with new services
const { submissionId, documents } = await unifiedApi.tools.createSubmissionWithDocuments(files);

const result = await unifiedApi.tools.submitWithFullWorkflow(submissionId);
// Returns: { submissionId, approvalId, complianceScore, auditTrailId }

const dashboardData = await unifiedApi.tools.getSubmissionDashboard(submissionId);
// Returns: { submission, documents, approval, compliance, auditTrail, governance }
```

## 🎣 **Hook Integration**

### **Existing Hook (Still Works)**
```typescript
// Existing hook continues to work exactly as before
import { useToolSubmission } from '@/app/tools/submit/useToolSubmission';

function MyComponent() {
  const {
    data,
    update,
    save,
    submit,
    runPrecheck
  } = useToolSubmission('submission-123');
  
  // All existing functionality preserved
}
```

### **New Unified Hook (Enhanced)**
```typescript
// New unified hook with all features integrated
import { useUnifiedSubmission } from '@/hooks/useUnifiedSubmission';

function MyComponent() {
  const {
    // Core submission data
    submission,
    
    // Document processing
    documents,
    uploadDocuments,
    processDocuments,
    
    // Approval workflow
    approval,
    startApprovalTracking,
    
    // Compliance
    compliance,
    runComplianceCheck,
    
    // Audit trail
    auditTrail,
    loadAuditTrail,
    
    // Live governance
    governance,
    loadGovernanceEvents,
    
    // Export
    exportEverything,
    
    // Existing functionality
    update,
    save,
    submit,
    canSubmit,
    completionPercentage
  } = useUnifiedSubmission('submission-123');
}
```

## 🌐 **WebSocket Integration**

### **Existing WebSocket (Enhanced)**
```typescript
// Existing WebSocket service now supports new event types
import webSocketService from '@/services/websocket';

// Existing subscriptions still work
webSocketService.subscribeToGovernance();
webSocketService.subscribeToAgents();

// New unified subscription
const unsubscribe = unifiedApi.websocket.subscribeToAllEvents({
  onGovernanceEvent: (event) => console.log('Governance event:', event),
  onApprovalUpdate: (update) => console.log('Approval update:', update),
  onComplianceUpdate: (update) => console.log('Compliance update:', update),
  onProcessingUpdate: (update) => console.log('Processing update:', update)
});
```

## 🗄️ **Database Integration**

### **Existing Database (Enhanced)**
The new components integrate with the existing database structure:

```sql
-- Existing tables (unchanged)
submissions
users
organizations
audit_logs

-- New tables (automatically created)
document_processing_results
approval_workflow_stages
compliance_scores
governance_events
report_exports
```

### **API Endpoints (Enhanced)**
```typescript
// Existing endpoints (unchanged)
GET  /api/tools/submissions/:id
POST /api/tools/submissions
PUT  /api/tools/submissions/:id

// New endpoints (integrated)
GET  /api/documents/:id/status
POST /api/documents/:id/process
GET  /api/approvals/metrics/:id
POST /api/compliance/scores/:id/calculate
GET  /api/audit/submissions/:id/events
GET  /api/governance/live-metrics
POST /api/reports/generate
```

## 🎨 **Component Integration**

### **Existing Components (Enhanced)**
```typescript
// Existing components can now use new features
import { useUnifiedSubmission } from '@/hooks/useUnifiedSubmission';
import { DocumentUploadZone } from '@/components/document-processing';
import { ApprovalTimeTracker } from '@/components/approval-workflow';

function ExistingComponent() {
  const { documents, uploadDocuments, approval } = useUnifiedSubmission();
  
  return (
    <div>
      {/* Existing UI */}
      <ExistingForm />
      
      {/* New components integrated */}
      <DocumentUploadZone onDocumentsChange={uploadDocuments} />
      <ApprovalTimeTracker submissionId={approval.id} />
    </div>
  );
}
```

### **New Components (Fully Integrated)**
```typescript
// All new components work with existing data
import { DocumentProcessingPipeline } from '@/components/document-processing';
import { ApprovalWorkflowDashboard } from '@/components/approval-workflow';
import { ComplianceScoring } from '@/components/compliance';
import { AuditTrailVisualization } from '@/components/audit';
import { LiveGovernanceFeed } from '@/components/real-time';
import { ExportReports } from '@/components/reports';

function NewComponent() {
  const { 
    submission, 
    documents, 
    approval, 
    compliance, 
    auditTrail, 
    governance 
  } = useUnifiedSubmission();
  
  return (
    <div>
      <DocumentProcessingPipeline onProcessingComplete={handleComplete} />
      <ApprovalWorkflowDashboard onRequestSelect={handleSelect} />
      <ComplianceScoring submissionId={submission.id} />
      <AuditTrailVisualization submissionId={submission.id} />
      <LiveGovernanceFeed isLive={true} />
      <ExportReports onExportComplete={handleExport} />
    </div>
  );
}
```

## 🔄 **Migration Path**

### **Option 1: Gradual Integration (Recommended)**
```typescript
// Start with existing components
function MyExistingComponent() {
  const existingHook = useToolSubmission();
  
  // Gradually add new features
  const { documents } = useUnifiedSubmission();
  
  return (
    <div>
      <ExistingForm {...existingHook} />
      <DocumentUploadZone documents={documents} />
    </div>
  );
}
```

### **Option 2: Full Migration**
```typescript
// Replace existing hook with unified hook
function MyNewComponent() {
  const unifiedHook = useUnifiedSubmission();
  
  return (
    <div>
      <NewForm {...unifiedHook} />
      <AllNewComponents {...unifiedHook} />
    </div>
  );
}
```

### **Option 3: Hybrid Approach**
```typescript
// Use both hooks side by side
function MyHybridComponent() {
  const existing = useToolSubmission();
  const enhanced = useUnifiedSubmission();
  
  return (
    <div>
      <ExistingForm {...existing} />
      <NewFeatures {...enhanced} />
    </div>
  );
}
```

## 🚀 **Getting Started**

### **1. Install Dependencies**
```bash
# No new dependencies required - uses existing ones
npm install
```

### **2. Update Environment Variables**
```bash
# Existing variables (unchanged)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# New variables (optional)
VITE_ENABLE_DOCUMENT_PROCESSING=true
VITE_ENABLE_APPROVAL_WORKFLOW=true
VITE_ENABLE_COMPLIANCE_SCORING=true
```

### **3. Import New Components**
```typescript
// Import what you need
import { DocumentProcessingPipeline } from '@/components/document-processing';
import { useUnifiedSubmission } from '@/hooks/useUnifiedSubmission';

// Use in your components
function MyComponent() {
  const { documents, uploadDocuments } = useUnifiedSubmission();
  
  return (
    <DocumentProcessingPipeline onDocumentsChange={uploadDocuments} />
  );
}
```

### **4. Test Integration**
```typescript
// Test that existing functionality still works
import { useToolSubmission } from '@/app/tools/submit/useToolSubmission';

// Test that new functionality works
import { useUnifiedSubmission } from '@/hooks/useUnifiedSubmission';

// Test that WebSocket integration works
import webSocketService from '@/services/websocket';
```

## 🔧 **Configuration**

### **Feature Flags**
```typescript
// Enable/disable features
const config = {
  documentProcessing: process.env.VITE_ENABLE_DOCUMENT_PROCESSING === 'true',
  approvalWorkflow: process.env.VITE_ENABLE_APPROVAL_WORKFLOW === 'true',
  complianceScoring: process.env.VITE_ENABLE_COMPLIANCE_SCORING === 'true',
  auditTrail: process.env.VITE_ENABLE_AUDIT_TRAIL === 'true',
  liveGovernance: process.env.VITE_ENABLE_LIVE_GOVERNANCE === 'true',
  reports: process.env.VITE_ENABLE_REPORTS === 'true'
};
```

### **API Configuration**
```typescript
// API base URLs (uses existing configuration)
const API_BASE = process.env.NODE_ENV === 'development' ? '' : '';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';
```

## 📊 **Performance Considerations**

### **Lazy Loading**
```typescript
// Lazy load new components
const DocumentProcessingPipeline = lazy(() => 
  import('@/components/document-processing/DocumentProcessingPipeline')
);

const ApprovalWorkflowDashboard = lazy(() => 
  import('@/components/approval-workflow/ApprovalWorkflowDashboard')
);
```

### **Data Caching**
```typescript
// Use existing caching strategies
const { data, isLoading, error } = useSWR(
  `/api/submissions/${id}`,
  () => unifiedApi.tools.fetchSubmission(id)
);
```

## 🧪 **Testing**

### **Existing Tests (Still Pass)**
```bash
# All existing tests continue to pass
npm test
```

### **New Tests**
```bash
# Test new components
npm test -- --testPathPattern="components/document-processing"
npm test -- --testPathPattern="components/approval-workflow"
npm test -- --testPathPattern="hooks/useUnifiedSubmission"
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **WebSocket Connection**
   ```typescript
   // Check WebSocket connection
   console.log('WebSocket connected:', webSocketService.isConnected());
   ```

2. **API Endpoints**
   ```typescript
   // Check API configuration
   console.log('API Base:', process.env.VITE_API_URL);
   ```

3. **Component Import**
   ```typescript
   // Check component imports
   import { DocumentProcessingPipeline } from '@/components/document-processing';
   ```

### **Debug Mode**
```typescript
// Enable debug logging
localStorage.setItem('debug', 'aicomplyr:*');
```

## 📈 **Monitoring**

### **Analytics Integration**
```typescript
// Existing analytics continue to work
trackSubmissionEvent('submit_completed', { id: submissionId });

// New analytics events
trackSubmissionEvent('document_uploaded', { documentId, fileSize });
trackSubmissionEvent('approval_accelerated', { timeSaved, accelerationFactor });
```

### **Error Tracking**
```typescript
// Existing error tracking continues to work
try {
  await unifiedApi.tools.submitSubmission(id);
} catch (error) {
  console.error('Submission failed:', error);
  // Existing error handling
}
```

## 🎯 **Summary**

The new components are **fully integrated** with the existing Lovable frontend:

- ✅ **Backward Compatible**: All existing functionality preserved
- ✅ **Enhanced APIs**: New services integrate with existing infrastructure
- ✅ **Unified Hooks**: Enhanced hooks provide access to all features
- ✅ **WebSocket Integration**: Live updates for all new features
- ✅ **Database Integration**: Uses existing database with new tables
- ✅ **Component Integration**: New components work with existing data
- ✅ **Migration Path**: Multiple options for gradual or full migration

The integration provides a seamless experience where existing functionality continues to work while new features are available when needed.