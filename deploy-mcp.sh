#!/bin/bash

# AICOMPLYR MCP Server Deployment Script
# Deploys the MCP server to Fly.io with proper configuration

set -e

echo "🚀 Deploying AICOMPLYR MCP Server..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supa-mcp-enhanced/fly.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

cd supa-mcp-enhanced

# Generate signing key if not provided
if [ -z "$MCP_SIGNING_KEY" ]; then
    echo "🔑 Generating MCP signing key..."
    MCP_SIGNING_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "Generated signing key: $MCP_SIGNING_KEY"
    echo "⚠️  Save this key securely - you'll need it for the frontend!"
fi

# Deploy to Fly.io
echo "📦 Deploying to Fly.io..."
fly launch --name aicomplyr-mcp --region iad --no-deploy

# Set secrets
echo "🔐 Setting secrets..."
fly secrets set \
    SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_KEY="$SUPABASE_KEY" \
    MCP_SIGNING_KEY="$MCP_SIGNING_KEY"

# Deploy the app
echo "🚀 Deploying app..."
fly deploy

# Get the app URL
APP_URL=$(fly info --json | jq -r '.Hostname')
echo "✅ MCP Server deployed successfully!"
echo "🌐 URL: https://$APP_URL"
echo "🔑 Signing Key: $MCP_SIGNING_KEY"
echo ""
echo "📋 Next steps:"
echo "1. Add MCP_SIGNING_KEY to your Vercel environment variables"
echo "2. Update NEXT_PUBLIC_MCP_URL in Vercel to: https://$APP_URL"
echo "3. Run the Supabase migration: 010_create_mcp_audit_table.sql"
echo "4. Test the connection with: curl https://$APP_URL/health"