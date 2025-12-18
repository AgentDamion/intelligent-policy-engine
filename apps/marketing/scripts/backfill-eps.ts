/**
 * Phase 3.B: EPS Backfill Script
 * 
 * Generates EPS for all approved/active policy instances lacking current_eps_id.
 * Safe, idempotent, batched execution with detailed progress tracking.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... deno run --allow-env --allow-net scripts/backfill-eps.ts
 *   OR (Node with dotenv):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-eps.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface BackfillStats {
  attempted: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ policy_instance_id: string; error: string }>;
}

async function backfillEPS() {
  const batchSize = 250;
  let offset = 0;
  const stats: BackfillStats = { 
    attempted: 0, 
    success: 0, 
    failed: 0, 
    skipped: 0,
    errors: []
  };

  console.log('🚀 Starting EPS backfill...');
  console.log(`   Target: policy_instances WHERE status IN ('approved','active') AND current_eps_id IS NULL`);
  console.log(`   Batch size: ${batchSize}`);
  console.log('');

  while (true) {
    const { data: instances, error } = await supabase
      .from('policy_instances')
      .select('id, scope_id, enterprise_id, status')
      .in('status', ['approved', 'active'])
      .is('current_eps_id', null)
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching policy instances:', error);
      break;
    }

    if (!instances || instances.length === 0) {
      console.log('✅ No more instances to backfill');
      break;
    }

    console.log(`📦 Processing batch ${Math.floor(offset / batchSize) + 1}: ${instances.length} instances (offset ${offset})`);

    for (const instance of instances) {
      stats.attempted++;
      
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('generate-eps', {
          body: {
            policy_instance_id: instance.id,
            scope_id: instance.scope_id,
            trigger_source: 'backfill'
          }
        });

        if (invokeError) {
          throw new Error(invokeError.message || JSON.stringify(invokeError));
        }

        if (data?.idempotent) {
          stats.skipped++;
          console.log(`   ⏭️  ${instance.id} (already has equivalent EPS)`);
        } else if (data?.eps) {
          stats.success++;
          console.log(`   ✅ ${instance.id} → EPS v${data.version} (hash: ${data.eps.content_hash?.substring(0, 8)}...)`);
        } else {
          stats.success++;
          console.log(`   ✅ ${instance.id} → EPS generated`);
        }

        // Rate limiting to avoid cold starts and throttling
        await sleep(150);
      } catch (err) {
        stats.failed++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`   ❌ Failed for ${instance.id}: ${errorMsg}`);
        stats.errors.push({
          policy_instance_id: instance.id,
          error: errorMsg
        });
      }
    }

    console.log('');
    console.log(`   Progress: ${stats.success} success | ${stats.skipped} skipped | ${stats.failed} failed | ${stats.attempted} total`);
    console.log('');

    offset += batchSize;
  }

  console.log('');
  console.log('🎉 Backfill complete!');
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Final Statistics');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Total attempted:  ${stats.attempted}`);
  console.log(`  ✅ Successful:    ${stats.success}`);
  console.log(`  ⏭️  Skipped:       ${stats.skipped}`);
  console.log(`  ❌ Failed:        ${stats.failed}`);
  console.log('═══════════════════════════════════════════════');

  if (stats.errors.length > 0) {
    console.log('');
    console.log('❌ Failed instances:');
    stats.errors.forEach(({ policy_instance_id, error }) => {
      console.log(`   - ${policy_instance_id}: ${error}`);
    });
  }

  console.log('');
  console.log('📊 Next steps:');
  console.log('   1. Monitor fallback rate: SELECT COUNT(*) FROM audit_events WHERE event_type = \'EPS_MISSING_FALLBACK\' AND created_at > NOW() - INTERVAL \'24 hours\'');
  console.log('   2. Check validation latency: SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY response_time_ms) FROM policy_validation_events WHERE timestamp > NOW() - INTERVAL \'24 hours\'');
  console.log('   3. Verify EPS coverage: SELECT COUNT(*) FILTER (WHERE current_eps_id IS NOT NULL)::FLOAT / COUNT(*) FROM policy_instances WHERE status IN (\'approved\',\'active\')');
  console.log('   4. After 48-72h monitoring with <1% fallback rate, proceed to Phase 3.C (disable fallback)');
  console.log('');

  return stats;
}

// Run backfill
backfillEPS()
  .then(stats => {
    if (stats.failed > 0) {
      console.error(`⚠️  Backfill completed with ${stats.failed} failures`);
      Deno.exit(1);
    }
    console.log('✨ Backfill succeeded!');
    Deno.exit(0);
  })
  .catch(err => {
    console.error('💥 Backfill crashed:', err);
    Deno.exit(1);
  });
