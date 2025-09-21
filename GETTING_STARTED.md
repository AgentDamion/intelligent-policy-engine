# AICOMPLYR.IO Platform - Getting Started

## 🚀 **Quick Start Guide**

This guide will help you set up and run the AICOMPLYR.IO platform with the new 5-application architecture.

## 📋 **Prerequisites**

- **Node.js 18+** (20+ recommended)
- **npm 8+** or **yarn**
- **Supabase account** and project
- **Git**

## 🏗️ **Project Structure**

```
aicomplyr-platform/
├── packages/                    # Shared packages
│   ├── shared/                 # Common utilities and types
│   ├── scoring/                # Compliance scoring engine
│   ├── billing/                # Stripe integration
│   ├── sales/                  # CRM integration
│   └── success/                # Customer health scoring
├── apps/                       # Frontend applications
│   ├── enterprise-platform/    # app.aicomplyr.io
│   ├── public-website/         # aicomplyr.io
│   ├── agency-portal/          # agency.aicomplyr.io
│   ├── marketplace-platform/   # marketplace.aicomplyr.io
│   └── admin-dashboard/        # admin.aicomplyr.io
├── api/                        # Backend APIs
│   ├── enterprise/             # Enterprise management
│   ├── agency/                 # Agency operations
│   ├── marketplace/            # Marketplace transactions
│   └── admin/                  # Business operations
└── supabase/                   # Database and edge functions
    ├── migrations/             # Database schema
    ├── functions/              # Edge functions
    └── seed/                   # Seed data
```

## 🚀 **Installation**

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd aicomplyr-platform

# Install all dependencies
npm install
```

### 2. Environment Setup

Create environment files for each application:

```bash
# Root environment
cp .env.example .env.local

# Enterprise platform
cp apps/enterprise-platform/.env.example apps/enterprise-platform/.env.local

# Add your Supabase credentials
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> apps/enterprise-platform/.env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> apps/enterprise-platform/.env.local
```

### 3. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase
supabase start

# Apply migrations
npm run db:migrate

# Seed data
npm run db:seed
```

## 🏃‍♂️ **Running the Applications**

### Development Mode

```bash
# Run all applications in development
npm run dev

# Or run specific applications
npm run dev --filter=@aicomplyr/enterprise-platform
npm run dev --filter=@aicomplyr/public-website
```

### Individual Application Commands

```bash
# Enterprise Platform (app.aicomplyr.io)
cd apps/enterprise-platform
npm run dev

# Public Website (aicomplyr.io)
cd apps/public-website
npm run dev

# Agency Portal (agency.aicomplyr.io)
cd apps/agency-portal
npm run dev

# Marketplace Platform (marketplace.aicomplyr.io)
cd apps/marketplace-platform
npm run dev

# Admin Dashboard (admin.aicomplyr.io)
cd apps/admin-dashboard
npm run dev
```

## 🌐 **Application URLs**

When running in development:

- **Enterprise Platform**: http://localhost:3000
- **Public Website**: http://localhost:3001
- **Agency Portal**: http://localhost:3002
- **Marketplace Platform**: http://localhost:3003
- **Admin Dashboard**: http://localhost:3004

## 🛠️ **Development Workflow**

### 1. **Lovable Frontend Development**

For each application, you can:

1. **Design in Lovable**: Build the UI visually
2. **Export to Next.js**: Get production-ready code
3. **Integrate with Backend**: Connect to Supabase and APIs
4. **Deploy to Vercel**: Automatic deployment

### 2. **Cursor Backend Development**

For packages and APIs:

1. **Use Cursor AI**: Get AI assistance for coding
2. **Build Packages**: Create reusable business logic
3. **Develop APIs**: Build serverless functions
4. **Test Integration**: Ensure everything works together

### 3. **Supabase Backend**

For database and real-time features:

1. **Design Schema**: Create tables and relationships
2. **Set RLS Policies**: Ensure data security
3. **Create Edge Functions**: Add business logic
4. **Enable Real-time**: Live updates across apps

## 🔧 **Configuration**

### **Environment Variables**

Each application needs specific environment variables:

```bash
# Shared variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
HUBSPOT_API_KEY=your_hubspot_api_key

# Application-specific
NEXT_PUBLIC_APP_DOMAIN=app.aicomplyr.io
NEXT_PUBLIC_AGENCY_DOMAIN=agency.aicomplyr.io
NEXT_PUBLIC_MARKETPLACE_DOMAIN=marketplace.aicomplyr.io
```

### **Vercel Deployment**

Each application can be deployed separately to Vercel:

1. **Connect Repository**: Link your GitHub repo
2. **Set Environment Variables**: Add production secrets
3. **Configure Domains**: Set up custom domains
4. **Deploy**: Automatic deployment on push

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --filter=@aicomplyr/scoring

# Run tests for specific app
npm test --filter=@aicomplyr/enterprise-platform
```

## 📊 **Monitoring**

### **Development Monitoring**

- **Vercel Analytics**: Performance and usage
- **Supabase Dashboard**: Database and real-time
- **Console Logs**: Debug information

### **Production Monitoring**

- **Vercel Analytics**: Business metrics
- **Supabase Monitoring**: Database performance
- **Error Tracking**: Real-time error alerts
- **Business Intelligence**: Customer health scoring

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port Conflicts**: Make sure ports 3000-3004 are available
2. **Environment Variables**: Check all required variables are set
3. **Database Connection**: Verify Supabase credentials
4. **Package Dependencies**: Run `npm install` in root directory

### **Debug Mode**

```bash
# Enable debug logging
export DEBUG=aicomplyr:*

# Run with debug output
npm run dev
```

## 🎯 **Next Steps**

1. **Start with Enterprise Platform**: Migrate existing functionality
2. **Build Public Website**: Create marketing and lead generation
3. **Develop Marketplace**: Build revenue generation platform
4. **Create Agency Portal**: Enable partner operations
5. **Deploy Admin Dashboard**: Monitor business operations

## 📚 **Documentation**

- **API Documentation**: `/docs/api/`
- **Component Library**: `/docs/components/`
- **Database Schema**: `/docs/database/`
- **Deployment Guide**: `/docs/deployment/`

## 🤝 **Support**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check the docs folder
- **Community**: Join our Discord server

---

**Ready to build the future of AI governance? Let's get started! 🚀**