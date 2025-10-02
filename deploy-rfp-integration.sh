#!/bin/bash

# RFP/RFI Integration Deployment Script
# This script deploys the complete RFP/RFI integration to Supabase

set -e

echo "🚀 Deploying RFP/RFI Integration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

echo "📊 Deploying database migrations..."

# Apply migrations in order
supabase db push

echo "⚡ Deploying edge functions..."

# Deploy RFI document parser
echo "  Deploying rfi_document_parser..."
supabase functions deploy rfi_document_parser

# Deploy RFP scoring function
echo "  Deploying rfp_score_response..."
supabase functions deploy rfp_score_response

echo "🔧 Setting up RPC functions..."

# The RPC functions are included in the migrations, so they should be available
echo "  RPC functions deployed via migrations"

echo "🧪 Running integration tests..."

# Set environment variables for testing
export SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
export SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

# Run tests
node test-rfp-integration.js

echo "✅ RFP/RFI Integration deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your UI to use the new orchestration functions"
echo "2. Add RFP/RFI navigation under Requests & Submissions"
echo "3. Configure your agent-coordinator endpoint"
echo "4. Test with real RFP/RFI documents"
echo ""
echo "📚 Documentation: See RFP_RFI_INTEGRATION_README.md for detailed usage"