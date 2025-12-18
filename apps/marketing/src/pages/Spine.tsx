import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { SpineLayout } from '@/components/agentic/spine/SpineLayout';
import { supabase } from '@/integrations/supabase/client';

export default function Spine() {
  const { epsId } = useParams<{ epsId: string }>();
  
  // Insert test data once for demo purposes
  useEffect(() => {
    const insertTestData = async () => {
      if (!epsId) return;
      
      // Check if test data already exists
      const { data: existing } = await supabase
        .from('agent_activities')
        .select('id')
        .eq('workspace_id', epsId)
        .not('details->suggested_actions', 'is', null)
        .limit(1);
      
      if (existing && existing.length > 0) return; // Already has test data
      
      // Insert test agent activities with suggested actions
      await supabase.from('agent_activities').insert([
        {
          agent: 'AuditAgent',
          action: 'finalize_proof_bundle',
          status: 'complete',
          workspace_id: epsId,
          details: {
            reasoning: 'Decision attested and proof bundle finalized',
            suggested_actions: [
              {
                label: 'View Similar Decisions',
                action_type: 'navigate',
                target: '/enterprise/decisions?similar_to=' + epsId,
                priority: 'high',
                context: { count: 3, timeframe: 'last_quarter' }
              },
              {
                label: 'Export Audit Package',
                action_type: 'download',
                target: '/api/proof-bundles/' + epsId + '/export',
                priority: 'medium',
                context: { format: 'pdf', includes_metadata: true }
              },
              {
                label: 'See Decision Timeline',
                action_type: 'navigate',
                target: '/spine/' + epsId + '/timeline',
                priority: 'low',
                context: { events: 12 }
              }
            ]
          }
        },
        {
          agent: 'PolicyAgent',
          action: 'detect_drift',
          status: 'complete',
          workspace_id: epsId,
          details: {
            reasoning: 'Policy drift detected in vendor AI tools',
            suggested_actions: [
              {
                label: 'Review Policy Changes',
                action_type: 'navigate',
                target: '/policies/compare',
                priority: 'high',
                context: { affected_tools: 2 }
              },
              {
                label: 'Download Drift Report',
                action_type: 'download',
                target: '/api/drift-reports/latest',
                priority: 'medium'
              }
            ]
          }
        }
      ]);
    };
    
    insertTestData();
  }, [epsId]);
  
  // Error state for missing epsId
  if (!epsId) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="text-center space-y-s3">
          <div className="text-[16px] font-semibold text-ink-900">
            No EPS ID Provided
          </div>
          <div className="text-[14px] text-ink-700">
            Unable to load decision package. Please check the URL.
          </div>
          <a 
            href="/agentic?tab=weave"
            className="inline-block px-s3 py-s2 bg-ink-900 text-white rounded-r1 text-[14px] font-medium hover:bg-ink-800 focus:shadow-focus-ring outline-none"
          >
            Return to Weave
          </a>
        </div>
      </div>
    );
  }

  // Render SpineLayout in standalone mode (no AgenticHeader)
  return (
    <div className="h-screen overflow-hidden bg-surface-0">
      <SpineLayout 
        threadId={epsId}
        isStandalone={true}
      />
    </div>
  );
}
