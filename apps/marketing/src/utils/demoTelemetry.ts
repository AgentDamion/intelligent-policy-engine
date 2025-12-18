import { trackEvent } from './analytics';

export const DemoEvents = {
  // Engagement
  DEMO_STARTED: 'demo_started',
  DEMO_COMPLETED: 'demo_completed',
  DEMO_ABANDONED: 'demo_abandoned',
  
  // Interaction
  DEMO_PAUSED: 'demo_paused',
  DEMO_RESUMED: 'demo_resumed',
  DEMO_SPEED_CHANGED: 'demo_speed_changed',
  DEMO_STAGE_SKIPPED: 'demo_stage_skipped',
  DEMO_REPLAYED: 'demo_replayed',
  
  // Exploration
  DEMO_AGENT_EXPANDED: 'demo_agent_expanded',
  DEMO_POLICY_CLICKED: 'demo_policy_clicked',
  DEMO_METRIC_CLICKED: 'demo_metric_clicked',
  DEMO_PROOF_HASH_COPIED: 'demo_proof_hash_copied',
  
  // Conversion
  DEMO_CTA_CLICKED: 'demo_cta_clicked',
  DEMO_SCENARIO_CHANGED: 'demo_scenario_changed',
  
  // Navigation
  DEMO_STAGE_CHANGED: 'demo_stage_changed',
  DEMO_NARRATIVE_TOGGLED: 'demo_narrative_toggled',
} as const;

export function trackDemoEvent(eventName: string, properties?: Record<string, any>) {
  trackEvent(eventName, {
    ...properties,
    demo_context: 'intelligence_demo',
    timestamp: new Date().toISOString(),
  });
}
