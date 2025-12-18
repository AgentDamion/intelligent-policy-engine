export const emitSpineTelemetry = (
  event: 'ui_spine_opened' 
    | 'ui_spine_proof_opened' 
    | 'ui_spine_cta_clicked' 
    | 'ui_spine_attested'
    | 'ui_spine_open_workbench',
  payload: {
    thread_id: string;
    policy_snapshot_id: string;
    decision_kind?: string;
    bundle_id?: string;
    tool_id?: string;
  }
) => {
  // De-identified payload
  const sanitized = {
    event,
    thread_id: payload.thread_id,
    policy_snapshot_id: payload.policy_snapshot_id,
    ...(payload.decision_kind && { decision_kind: payload.decision_kind }),
    ...(payload.bundle_id && { bundle_id: payload.bundle_id }),
    ...(payload.tool_id && { tool_id: payload.tool_id }),
    timestamp: Date.now()
  };
  
  console.log('[Spine Telemetry]', sanitized);
  // Future: POST to /api/v1/telemetry when API ready
};
