// Enhanced Collaboration Components
export { CollaborationIndicator } from './CollaborationIndicator';
export { RealTimeNotifications } from './RealTimeNotifications';
export { DocumentSectionTracker } from './DocumentSectionTracker';
export { AnnotationOverlay } from './AnnotationOverlay';
export { CollaborationChat } from './CollaborationChat';
export { ApprovalPipeline } from './ApprovalPipeline';

// Enhanced Hooks
export { useEnhancedCollaboration } from '@/hooks/useEnhancedCollaboration';

// Types
export type { UserPresence } from './CollaborationIndicator';
export type {
  CollaborationSession,
  DocumentAnnotation,
  CollaborationMessage,
  ApprovalWorkflow
} from '@/hooks/useEnhancedCollaboration';