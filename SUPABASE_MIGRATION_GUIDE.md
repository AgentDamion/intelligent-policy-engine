# 🚀 Complete Migration Guide: Railway/TablePlus → Supabase

This guide will help you migrate your AICOMPLYR application from Railway/TablePlus to Supabase, enabling seamless integration with your aicomplyr.io marketing site.

## 📋 Prerequisites

- [Supabase Account](https://supabase.com) (free tier available)
- Node.js 18+ installed
- Your existing AICOMPLYR codebase

## 🔧 Step 1: Create Supabase Project

### 1.1 Sign Up/Login to Supabase
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in with GitHub
3. Click "New Project"

### 1.2 Project Configuration
- **Name**: `aicomplyr-intelligence`
- **Database Password**: Generate a strong password (save it!)
- **Region**: Choose closest to your users
- **Pricing Plan**: Start with Free tier

### 1.3 Get Project Credentials
After project creation, go to **Settings** → **API** and copy:
- **Project URL**: `https://your-project-ref.supabase.co`
- **Anon Key**: `your-anon-key-here`
- **Service Role Key**: `your-service-role-key-here`

## 🔑 Step 2: Environment Configuration

### 2.1 Create Environment File
Copy the example environment file:
```bash
cp env.supabase.example .env.local
```

### 2.2 Update Environment Variables
Edit `.env.local` with your actual Supabase credentials:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

## 🗄️ Step 3: Database Migration

### 3.1 Run Initial Migration
The migration files are already created in `supabase/migrations/`. Run them in order:

```bash
# Navigate to supabase directory
cd supabase

# List available migrations
node migrate.js list

# Run initial schema migration
node migrate.js run 001_initial_schema.sql

# Run enhanced features migration
node migrate.js run 002_enhanced_rls_and_features.sql
```

### 3.2 Manual Migration (if needed)
Some SQL statements may need to be run manually in the Supabase dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the migration SQL
5. Click "Run" to execute

## 🔐 Step 4: Authentication Setup

### 4.1 Configure Auth Settings
In Supabase Dashboard → **Authentication** → **Settings**:

- **Site URL**: `http://localhost:3000` (development)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `https://app.aicomplyr.io/auth/callback` (production)
- **JWT Expiry**: `3600` (1 hour)
- **Enable Refresh Token Rotation**: ✅

### 4.2 Set Up Auth Providers
Configure authentication methods in **Authentication** → **Providers**:

- **Email**: Enable email/password authentication
- **Google**: Add your Google OAuth credentials
- **GitHub**: Add your GitHub OAuth credentials

## 🌐 Step 5: Update Application Code

### 5.1 Update Database Connections
Replace Railway database connections with Supabase:

```javascript
// Old Railway connection
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// New Supabase connection
import { supabase } from '@/lib/supabase/client';
```

### 5.2 Update API Routes
Example of updating an API route:

```javascript
// Old Railway approach
export default async function handler(req, res) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users_enhanced');
    res.json(result.rows);
  } finally {
    client.release();
  }
}

// New Supabase approach
export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('users_enhanced')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 5.3 Update Frontend Components
Example of updating a React component:

```javascript
// Old approach with direct API calls
const [users, setUsers] = useState([]);

useEffect(() => {
  fetch('/api/users')
    .then(res => res.json())
    .then(data => setUsers(data));
}, []);

// New Supabase approach
import { supabase } from '@/lib/supabase/client';

const [users, setUsers] = useState([]);

useEffect(() => {
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users_enhanced')
      .select('*');
    
    if (!error) setUsers(data);
  };
  
  fetchUsers();
}, []);
```

## 🔄 Step 6: Real-time Features

### 6.1 Enable Real-time Subscriptions
Supabase provides real-time capabilities out of the box:

```javascript
// Subscribe to real-time changes
const subscription = supabase
  .channel('contracts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'contracts' },
    (payload) => {
      console.log('Contract changed:', payload);
      // Update your UI
    }
  )
  .subscribe();
```

### 6.2 Clean Up Subscription
```javascript
useEffect(() => {
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 🧪 Step 7: Testing & Validation

### 7.1 Test Database Connection
```bash
# Test Supabase connection
node supabase/migrate.js status
```

### 7.2 Test Authentication
1. Start your development server
2. Try to sign up/sign in
3. Verify user creation in Supabase dashboard

### 7.3 Test Data Operations
1. Create a test organization
2. Create test policies
3. Verify RLS policies work correctly

## 🚀 Step 8: Production Deployment

### 8.1 Update Production Environment
```bash
# Production environment variables
NEXT_PUBLIC_APP_URL=https://app.aicomplyr.io
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://app.aicomplyr.io/auth/callback
```

### 8.2 Deploy to Production
1. Update your deployment platform (Vercel, Netlify, etc.)
2. Set production environment variables
3. Deploy your application

### 8.3 Update Supabase Settings
In Supabase Dashboard:
- Update **Site URL** to production domain
- Add production **Redirect URLs**
- Configure custom domain if needed

## 🔍 Step 9: Monitoring & Maintenance

### 9.1 Supabase Dashboard Monitoring
- **Database**: Monitor query performance
- **Authentication**: Track user sign-ups/logins
- **Logs**: Review API requests and errors
- **Storage**: Monitor file uploads (if using)

### 9.2 Performance Optimization
- Use Supabase's built-in caching
- Implement proper indexing
- Monitor slow queries
- Use connection pooling for high-traffic scenarios

## 🆘 Troubleshooting

### Common Issues

#### 1. Connection Errors
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### 2. RLS Policy Issues
- Verify user authentication
- Check organization membership
- Review RLS policies in Supabase dashboard

#### 3. Migration Failures
- Check SQL syntax in Supabase SQL editor
- Verify table dependencies
- Run migrations manually if needed

### Getting Help
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## 📚 Additional Resources

### Supabase Features to Explore
- **Edge Functions**: Serverless functions
- **Storage**: File uploads and management
- **Database Functions**: Custom PostgreSQL functions
- **Webhooks**: External integrations
- **Analytics**: Usage tracking and insights

### Integration Examples
- **Next.js**: [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- **React**: [React + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- **Vue**: [Vue + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-vue)

## 🎯 Next Steps

After successful migration:

1. **Performance Testing**: Load test your application
2. **Security Review**: Audit RLS policies and permissions
3. **Backup Strategy**: Set up automated database backups
4. **Monitoring**: Implement comprehensive logging and alerting
5. **Documentation**: Update your team's development documentation

## 🎉 Migration Complete!

Congratulations! You've successfully migrated from Railway/TablePlus to Supabase. Your application now has:

- ✅ Modern, scalable database infrastructure
- ✅ Built-in authentication and authorization
- ✅ Real-time capabilities
- ✅ Row-level security
- ✅ Seamless integration with aicomplyr.io
- ✅ Better development experience

Your AICOMPLYR platform is now ready for production scale and seamless integration with your marketing site!
