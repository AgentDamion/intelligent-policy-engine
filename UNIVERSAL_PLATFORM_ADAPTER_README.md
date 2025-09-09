# Universal Platform Adapter System

A comprehensive platform integration system that enables seamless compliance data synchronization across multiple enterprise platforms including Veeva Vault, SharePoint, and Adobe Creative Cloud.

## 🚀 Overview

The Universal Platform Adapter system provides "invisible compliance" by automatically integrating AI-generated content with enterprise platforms while maintaining full compliance tracking and metadata embedding.

### Key Features

- **Universal Integration**: Single API for multiple platform integrations
- **Compliance-First**: Automatic compliance checking and metadata embedding
- **Platform Support**: Veeva Vault, SharePoint, Adobe Creative Cloud
- **Async Processing**: Scalable job processing with retry logic
- **Security**: Encrypted credential management and RLS policies
- **Monitoring**: Comprehensive metrics and alerting
- **XMP Metadata**: Adobe-specific metadata embedding for compliance

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Agent System  │───▶│ Compliance Check │───▶│ Platform Manager│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Adobe Creative │◀───│ Universal Platform│───▶│  Veeva Vault    │
│      Cloud      │    │   Coordinator    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │   SharePoint    │
                       └─────────────────┘
```

## 📁 Project Structure

```
supabase/functions/
├── platform-manager/          # Platform configuration management
│   └── index.ts
├── platform-universal/        # Universal integration coordinator
│   └── index.ts
├── platform-adobe/            # Adobe Creative Cloud adapter
│   ├── index.ts
│   └── adapter.ts
├── platform-veeva/            # Veeva Vault adapter
│   ├── index.ts
│   └── adapter.ts
├── platform-sharepoint/       # SharePoint adapter
│   ├── index.ts
│   └── adapter.ts
├── shared/                    # Shared utilities
│   ├── platform-adapter-base.ts
│   ├── platform-adapter-types.ts
│   ├── metadata-transformer.ts
│   ├── credential-manager.ts
│   └── platform-config.ts
└── compliance_check_agent_activity/
    └── index.ts               # Enhanced with platform integration
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- Supabase CLI
- Supabase project with Edge Functions enabled

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd universal-platform-adapter

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your Supabase credentials
```

### 3. Database Setup

```bash
# Run database migrations
supabase db push

# Apply monitoring setup
psql -h your-db-host -U postgres -d postgres -f monitoring-setup.sql
```

### 4. Deploy Edge Functions

```bash
# Deploy all platform adapters
./deploy-platform-adapters.sh

# Or deploy individually
supabase functions deploy platform-manager
supabase functions deploy platform-universal
supabase functions deploy platform-adobe
supabase functions deploy platform-veeva
supabase functions deploy platform-sharepoint
```

### 5. Configure Platform Credentials

Set up OAuth2 credentials for each platform in the Supabase dashboard:

```bash
# Adobe Creative Cloud
supabase secrets set ADOBE_CLIENT_ID="your-client-id"
supabase secrets set ADOBE_CLIENT_SECRET="your-client-secret"

# Veeva Vault
supabase secrets set VEEVA_CLIENT_ID="your-client-id"
supabase secrets set VEEVA_CLIENT_SECRET="your-client-secret"

# SharePoint
supabase secrets set SHAREPOINT_CLIENT_ID="your-client-id"
supabase secrets set SHAREPOINT_CLIENT_SECRET="your-client-secret"
```

## 📚 API Documentation

### Platform Manager

Manage platform configurations and credentials.

#### Endpoints

- `GET /platform-manager` - List platform configurations
- `GET /platform-manager/{id}` - Get specific configuration
- `POST /platform-manager` - Create new configuration
- `PUT /platform-manager/{id}` - Update configuration
- `DELETE /platform-manager/{id}` - Delete configuration
- `POST /platform-manager/{id}/test` - Test platform connection
- `POST /platform-manager/{id}/validate` - Validate configuration
- `POST /platform-manager/{id}/rotate-credentials` - Rotate credentials

#### Example: Create Platform Configuration

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/platform-manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-supabase-key',
    'x-org-id': 'your-organization-id'
  },
  body: JSON.stringify({
    platform_type: 'adobe',
    platform_name: 'Adobe Creative Cloud',
    configuration: {
      endpoints: {
        base_url: 'https://api.adobe.io/v1'
      }
    },
    credentials: {
      client_id: 'your-client-id',
      client_secret: 'your-client-secret',
      access_token: 'your-access-token'
    }
  })
});
```

### Universal Platform Coordinator

Orchestrate integrations across multiple platforms.

#### Endpoints

- `POST /platform-universal/integrate` - Trigger platform integration
- `GET /platform-universal/job/{job_id}` - Check job status
- `POST /platform-universal/retry/{job_id}` - Retry failed job
- `GET /platform-universal/health` - Health check

#### Example: Trigger Integration

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/platform-universal/integrate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-supabase-key',
    'x-org-id': 'your-organization-id'
  },
  body: JSON.stringify({
    activity_id: 'activity-123',
    compliance_data: {
      aicomplyr: {
        version: '1.0.0',
        generated_at: '2024-01-01T00:00:00Z',
        project_id: 'project-123',
        organization_id: 'org-123',
        activity_id: 'activity-123'
      },
      compliance: {
        status: 'compliant',
        score: 95,
        risk_level: 'low',
        last_checked: '2024-01-01T00:00:00Z'
      },
      ai_tools: [
        {
          tool_name: 'OpenAI GPT-4',
          usage_type: 'content_generation',
          approval_status: 'approved',
          evidence_files: [],
          usage_timestamp: '2024-01-01T00:00:00Z'
        }
      ],
      policy_checks: [],
      violations: [],
      references: {
        detailed_report_url: 'https://aicomplyr.io/reports/activity-123',
        audit_trail_url: 'https://aicomplyr.io/audit/activity-123'
      }
    },
    target_platforms: ['adobe', 'veeva'],
    async: true,
    priority: 'normal'
  })
});
```

### Platform Adapters

Individual platform adapters for specific integrations.

#### Adobe Creative Cloud

- `GET /platform-adobe/health` - Health check
- `POST /platform-adobe/upload` - Upload file with compliance metadata
- `POST /platform-adobe/metadata` - Attach metadata to existing file
- `GET /platform-adobe/files` - List files
- `GET /platform-adobe/projects` - List projects

#### Veeva Vault

- `GET /platform-veeva/health` - Health check
- `POST /platform-veeva/upload` - Upload document to Vault
- `POST /platform-veeva/metadata` - Attach compliance metadata

#### SharePoint

- `GET /platform-sharepoint/health` - Health check
- `POST /platform-sharepoint/upload` - Upload file to SharePoint
- `POST /platform-sharepoint/metadata` - Attach metadata

## 🔧 Configuration

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Platform Credentials
ADOBE_CLIENT_ID=your-adobe-client-id
ADOBE_CLIENT_SECRET=your-adobe-client-secret
ADOBE_ACCESS_TOKEN=your-adobe-access-token

VEEVA_CLIENT_ID=your-veeva-client-id
VEEVA_CLIENT_SECRET=your-veeva-client-secret

SHAREPOINT_CLIENT_ID=your-sharepoint-client-id
SHAREPOINT_CLIENT_SECRET=your-sharepoint-client-secret

# Security
PLATFORM_CREDENTIALS_SECRET=your-encryption-secret
```

### Database Configuration

The system uses the following database tables:

- `platform_configurations` - Platform connection configurations
- `platform_integration_jobs` - Async integration jobs
- `platform_integration_logs` - Integration operation logs
- `platform_metrics` - Performance and health metrics

## 🧪 Testing

### Run Test Suite

```bash
# Run all tests
node test-platform-adapters.js

# Run with custom configuration
node test-platform-adapters.js --url https://your-project.supabase.co --key your-key --org your-org-id
```

### Test Coverage

- ✅ Platform Manager CRUD operations
- ✅ Universal Platform Coordinator integration
- ✅ Platform adapter health checks
- ✅ Compliance system integration
- ✅ Security headers validation
- ✅ Error handling
- ✅ Performance testing

## 📊 Monitoring

### Health Checks

```bash
# Check overall system health
curl https://your-project.supabase.co/functions/v1/platform-universal/health

# Check individual platform health
curl https://your-project.supabase.co/functions/v1/platform-adobe/health
curl https://your-project.supabase.co/functions/v1/platform-veeva/health
curl https://your-project.supabase.co/functions/v1/platform-sharepoint/health
```

### Metrics Dashboard

Access the monitoring dashboard to view:

- Platform integration success rates
- Error rates and trends
- Processing times
- Active job counts
- Platform health status

### Alerts

The system automatically alerts on:

- High error rates (>10%)
- Stuck jobs (>30 minutes)
- Connection failures
- No activity for extended periods

## 🔒 Security

### Credential Management

- All credentials are encrypted using AES-GCM
- Credentials are stored in Supabase Vault
- Automatic credential rotation support
- No credentials returned in API responses

### Access Control

- Row Level Security (RLS) policies
- Organization-based data isolation
- Service role for system operations
- User role for data access

### Data Protection

- CORS headers configured
- Input validation with Zod schemas
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Production Deployment

```bash
# Deploy to production
./deploy-platform-adapters.sh

# Set production environment variables
export SUPABASE_PROJECT_ID=your-production-project
export SUPABASE_ACCESS_TOKEN=your-production-token
export ENVIRONMENT=production

# Run deployment
./deploy-platform-adapters.sh
```

### Staging Deployment

```bash
# Deploy to staging
export ENVIRONMENT=staging
./deploy-platform-adapters.sh
```

## 🔄 Maintenance

### Data Cleanup

```sql
-- Clean up old integration logs (older than 90 days)
SELECT cleanup_platform_data();

-- Refresh monitoring views
SELECT refresh_platform_dashboard_metrics();
```

### Monitoring

```sql
-- Check platform health
SELECT * FROM platform_health_status;

-- Get integration summary
SELECT * FROM get_platform_integration_summary();

-- Check for alerts
SELECT * FROM check_platform_alerts();
```

## 🐛 Troubleshooting

### Common Issues

1. **Platform Connection Failures**
   - Check credentials in Supabase dashboard
   - Verify platform API endpoints
   - Check network connectivity

2. **Integration Job Failures**
   - Check job logs in `platform_integration_logs`
   - Verify platform configurations
   - Check for rate limiting

3. **Performance Issues**
   - Monitor job processing times
   - Check database performance
   - Review error rates

### Debug Mode

Enable debug logging by setting:

```bash
export DEBUG=platform-adapter:*
```

### Logs

View logs in Supabase dashboard:
- Edge Function logs
- Database logs
- Integration logs

## 📈 Performance

### Optimization

- Async job processing
- Connection pooling
- Caching strategies
- Batch operations

### Scaling

- Horizontal scaling via Supabase Edge Functions
- Database connection pooling
- Queue-based job processing
- CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub
- Contact the development team

## 🔮 Roadmap

### Upcoming Features

- [ ] Microsoft Teams integration
- [ ] Slack integration
- [ ] Google Drive integration
- [ ] Advanced analytics dashboard
- [ ] Webhook support
- [ ] Custom platform adapters
- [ ] Real-time notifications
- [ ] Mobile app support

### Version History

- **v1.0.0** - Initial release with Veeva, SharePoint, and Adobe support
- **v1.1.0** - Added async job processing and monitoring
- **v1.2.0** - Enhanced security and credential management
- **v1.3.0** - Added comprehensive testing and deployment automation

---

**Built with ❤️ for enterprise compliance and AI governance**