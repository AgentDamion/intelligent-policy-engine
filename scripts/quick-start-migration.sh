#!/bin/bash
# scripts/quick-start-migration.sh

echo "🚀 Quick Start: Supabase Auth Migration"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Installing new dependencies..."
node scripts/update-dependencies.js

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Step 2: Database migration..."
echo "Please run: supabase db push"
echo "This will apply the new auth metadata functions"

echo ""
echo "🔧 Step 3: Environment setup..."
echo "Please copy env.supabase-template to .env and fill in your Supabase credentials"

echo ""
echo "🧪 Step 4: Testing the migration..."
echo "1. Start the new server: node server-unified.js"
echo "2. Test health endpoint: curl http://localhost:3001/health"
echo "3. Run tests: npm test tests/auth-migration.test.js"

echo ""
echo "✅ Quick start complete!"
echo ""
echo "Next steps:"
echo "- Complete environment variable setup"
echo "- Test the new server"
echo "- Run the full migration checklist"
echo ""
echo "📖 See MIGRATION_CHECKLIST.md for detailed steps"
