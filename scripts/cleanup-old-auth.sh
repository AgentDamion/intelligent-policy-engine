#!/bin/bash
# scripts/cleanup-old-auth.sh

echo "🧹 Cleaning up old auth code..."

# Remove old auth files
rm -f api/middleware/auth0.js
rm -f api/middleware/custom-jwt.js
rm -f api/utils/jwt-utils.js
rm -f server-railway.js
rm -f server-supabase.js
rm -f server-supabase-fixed.js
rm -f server-supabase-clean.js
rm -f server-clean.js

# Remove old server files (after confirming new one works)
echo "⚠️  Old server files removed. Make sure server-unified.js works before deleting server.js"

# Remove Auth0 dependencies
npm uninstall express-jwt jwks-rsa jsonwebtoken express-session

# Update environment variables
echo "📝 Update your .env files:"
echo "  - Remove AUTH0_DOMAIN, AUTH0_AUDIENCE, etc."
echo "  - Remove JWT_SECRET"
echo "  - Remove SESSION_SECRET"
echo "  - Add SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY"

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Test server-unified.js"
echo "2. Update package.json dependencies"
echo "3. Update environment variables"
echo "4. Test authentication flow"
