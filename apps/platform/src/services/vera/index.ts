/**
 * VERA Services Index
 * 
 * Exports all VERA-related services for the Platform App
 */

// Chat Service - For VERA Chat interactions
export {
  submitVERAQuery,
  getPolicyExplanation,
  getComplianceGuidance,
  type VERAChatMessage,
  type VERAChatRequest,
  type VERAChatResponse
} from './veraChatService'

// Dashboard Service - For VERA Dashboard metrics
export {
  getVelocityMetrics,
  getDecisionQueue,
  getComplianceScore,
  getVERAState,
  getVERADashboardData,
  initializeVERAState,
  type VelocityMetrics,
  type DecisionQueueItem,
  type ComplianceScore,
  type VERAStateSnapshot,
  type VERADashboardData
} from './veraDashboardService'

// Preferences Service - For VERA configuration
export {
  getVERAPreferences,
  getVERAMode,
  setVERAMode,
  updateVERAPreferences,
  createDefaultVERAPreferences,
  getOrCreateVERAPreferences,
  getModeTransitionHistory,
  type VERAMode,
  type VERAPreferences,
  type NotificationPreferences,
  type UpdateVERAPreferencesInput
} from './veraPreferencesService'

// Proof Bundle Service - For VERA Proof Bundles
export {
  getProofBundles,
  getProofBundle,
  getProofBundleBySubmission,
  getProofBundleStats,
  verifyProofBundle,
  generateCertificateUrl,
  generateQRCodeData,
  type ProofBundle,
  type ProofBundleListItem,
  type ProofBundleFilters,
  type ProofBundleStats,
  type ProofBundleStatus,
  type DecisionType
} from './proofBundleService'

// Governance Thread Service - For PRD-aligned governance workflow
export {
  getThreads,
  getThread,
  getThreadWithActions,
  getInboxThreads,
  getResolvedThreads,
  getActionHistory,
  submitAction,
  approveThread,
  rejectThread,
  escalateThread,
  requestInfo,
  addComment,
  cancelThread,
  createThread,
  getThreadStats,
  type ThreadType,
  type ThreadStatus,
  type ThreadPriority,
  type ActorType,
  type ActionType,
  type GovernanceThread,
  type GovernanceAction,
  type ThreadFilters,
  type ThreadWithActions,
  type ActionInput
} from './governanceThreadService'

// Policy Studio Service - For policy management
export {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  archivePolicy,
  deletePolicy,
  getPolicyVersions,
  getPolicyVersion,
  getLatestPublishedVersion,
  createPolicyVersion,
  updatePolicyVersion,
  publishPolicyVersion,
  archivePolicyVersion,
  compareVersions,
  getPolicyStats,
  type PolicyStatus,
  type InheritanceMode,
  type Policy,
  type PolicyListItem,
  type PolicyVersion,
  type PolicyRules,
  type PolicyFilters,
  type CreatePolicyInput,
  type UpdatePolicyInput,
  type CreateVersionInput,
  type VersionDiff,
  type PolicyStats
} from './policyStudioService'
