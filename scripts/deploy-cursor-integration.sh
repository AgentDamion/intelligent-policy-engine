#!/bin/bash

# Deployment script for Cursor Agent Integration
# This script helps deploy the Cursor agent adapter to Supabase

echo "🚀 Deploying Cursor Agent Integration to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in the correct directory. Please run this from the project root."
    exit 1
fi

echo "📦 Deploying Supabase functions..."

# Deploy all functions
supabase functions deploy cursor-agent-adapter
supabase functions deploy generate_compliance_report

echo "🔧 Setting up environment variables..."

# Add Cursor Agent Adapter URL to environment
if [ -f ".env" ]; then
    if ! grep -q "CURSOR_AGENT_ADAPTER_URL" .env; then
        echo "CURSOR_AGENT_ADAPTER_URL=http://localhost:54321/functions/v1/cursor-agent-adapter" >> .env
    fi
else
    echo "CURSOR_AGENT_ADAPTER_URL=http://localhost:54321/functions/v1/cursor-agent-adapter" > .env
fi

echo "🗃️ Setting up database tables..."

# Create agent_activities table if it doesn't exist
supabase db push

echo "🧪 Running integration tests..."

# Run the test script
deno run --allow-net --allow-env supabase/functions/test-cursor-integration.ts

echo "✅ Deployment complete!"

echo ""
echo "🎯 Next Steps:"
echo "1. Test the integration in your development environment"
echo "2. Update your Lovable frontend to use the new edge functions"
echo "3. Monitor the agent activities in your Supabase dashboard"
echo "4. Gradually roll out to production"
echo ""

echo "🔍 Useful Commands:"
echo "- View logs: supabase functions logs cursor-agent-adapter"
echo "- Test locally: supabase functions serve"
echo "- View metrics: supabase functions metrics"
echo ""

echo "🚀 Your Cursor Agent Integration is now live!"
