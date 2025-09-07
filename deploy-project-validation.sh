#!/bin/bash

# Deploy Project Validation for Agent Ingestion
echo "🔍 Deploying Project Validation for Agent Ingestion..."

# Check if we're in the right directory
if [ ! -f "supabase/functions/ingest_agent/index.ts" ]; then
    echo "❌ Error: Please run this script from the aicomplyr-intelligence directory"
    exit 1
fi

echo ""
echo "1. Running project_id migration..."
node supabase/run-migrations-direct.mjs run 20250903180000_add_project_id_to_agent_activities.sql

if [ $? -eq 0 ]; then
    echo "✅ Project ID migration completed"
else
    echo "❌ Migration failed"
    echo "You may need to run this manually:"
    echo "node supabase/run-migrations-direct.mjs run 20250903180000_add_project_id_to_agent_activities.sql"
fi

echo ""
echo "2. Deploying updated edge functions..."

echo "Deploying ingest_agent function..."
npx supabase functions deploy ingest_agent

if [ $? -eq 0 ]; then
    echo "✅ ingest_agent function deployed"
else
    echo "❌ ingest_agent deployment failed"
    echo "You may need to run this manually:"
    echo "npx supabase functions deploy ingest_agent"
fi

echo "Deploying ingest_agent_activity function..."
npx supabase functions deploy ingest_agent_activity

if [ $? -eq 0 ]; then
    echo "✅ ingest_agent_activity function deployed"
else
    echo "❌ ingest_agent_activity deployment failed"
    echo "You may need to run this manually:"
    echo "npx supabase functions deploy ingest_agent_activity"
fi

echo ""
echo "�� Project Validation System deployment completed!"
echo ""
echo "What's new:"
echo "1. agent_activities table now includes project_id column"
echo "2. Both edge functions validate project_id before accepting data"
echo "3. Backward compatibility maintained for existing integrations"
echo "4. Project context is automatically enriched in responses"
echo ""
echo "Usage Examples:"
echo "Single activity with project:"
echo "POST /functions/v1/ingest_agent_activity"
echo '{"agent": "Test", "action": "Test", "project_id": "uuid"}'
echo ""
echo "Batch ingestion with project:"
echo "POST /functions/v1/ingest_agent"
echo '{"project_id": "uuid", "activities": [...]}'
echo ""
echo "Backward compatible (no project_id):"
echo "POST /functions/v1/ingest_agent_activity"
echo '{"agent": "Test", "action": "Test"}'
