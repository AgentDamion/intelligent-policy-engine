# AICOMPLYR - AI Governance Platform

A comprehensive AI governance platform for pharmaceutical enterprises and marketing agencies, featuring agentic AI systems, human override capabilities, and real-time policy distribution.

## 🚀 Features

### Core Systems
- **Enhanced Orchestration Engine** - Intelligent workflow routing and agent coordination
- **Trust & Transparency Layer** - Comprehensive audit trails and decision explainability
- **Agency-Enterprise Bridge** - Seamless communication between enterprises and agencies
- **Human Override System** - Manual intervention capabilities for AI decisions
- **Policy Distribution & Sync** - Real-time policy distribution with conflict detection
- **Agency Onboarding Portal** - Streamlined agency registration and tool approval

### AI Agents
- **Context Agent** - Analyzes user intent and urgency
- **Policy Agent** - Evaluates compliance and risk
- **Negotiation Agent** - Handles complex decision scenarios
- **Audit Agent** - Maintains comprehensive audit trails
- **Conflict Detection Agent** - Identifies policy conflicts
- **Pre-Flight Agent** - Pre-validates requests
- **Pattern Recognition Agent** - Learns from historical data

### Frontend Components
- **Unified Platform** - Modern React-based interface
- **Adaptive Navigation** - Context-aware navigation system
- **AI Agent Hub** - Real-time agent status and interaction
- **Live Governance Stream** - Real-time decision monitoring
- **Notification Center** - Centralized alert system

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Auth0** authentication
- **WebSocket** for real-time communication
- **Railway** deployment support

### Frontend
- **React.js** with modern hooks
- **Tailwind CSS** for styling
- **Zustand** for state management
- **WebSocket** for real-time updates

### AI Integration
- **OpenAI** API support
- **Anthropic** Claude API support
- **Custom AI services** for specialized tasks

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/aicomplyr-intelligence.git
   cd aicomplyr-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd ui && npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Backend API server
   npm run dev
   
   # Frontend React server (in another terminal)
   cd ui && npm start
   ```

## 🔧 Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aicomplyr

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Server
PORT=3000
NODE_ENV=development
```

## 🗄️ Database Schema

### Core Tables
- `organizations` - Enterprises and agencies
- `users` - User accounts and roles
- `policies` - AI governance policies
- `audit_entries` - Decision audit trails
- `policy_distributions` - Policy distribution tracking
- `agency_policy_compliance` - Compliance monitoring
- `policy_conflicts` - Conflict detection
- `agency_invitations` - Agency onboarding
- `agency_enterprise_relationships` - Enterprise-agency relationships

### Key Features
- **UUID primary keys** for scalability
- **JSONB columns** for flexible data storage
- **Comprehensive indexing** for performance
- **Triggers** for automatic timestamps
- **Views** for complex queries
- **Stored procedures** for business logic

## 🚀 Deployment

### Railway Deployment
```bash
# Deploy to Railway
railway up
```

### Environment Setup
1. Set environment variables in Railway dashboard
2. Configure database connection
3. Set up Auth0 application
4. Configure AI provider API keys

## 📚 API Documentation

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/agents/status` - Agent status
- `GET /api/governance/events` - Governance events
- `POST /api/enhanced-orchestration/process` - Process requests

### Agency Onboarding
- `POST /api/agency-onboarding/invite` - Invite agency
- `POST /api/agency-onboarding/register` - Register agency
- `POST /api/agency-onboarding/submit-tool` - Submit AI tool

### Policy Distribution
- `POST /api/policy-distribution/distribute` - Distribute policy
- `GET /api/policy-distribution/compliance/:agency_id` - Get compliance
- `GET /api/policy-distribution/conflicts/:agency_id` - Get conflicts

### Human Override
- `POST /api/overrides/request` - Request override
- `PUT /api/overrides/:id/approve` - Approve override
- `PUT /api/overrides/:id/reject` - Reject override

## 🧪 Testing

### Backend Tests
```bash
# Test API endpoints
npm run test

# Test health connection
npm run test-health

# Test agency API
npm run test-agency-api
```

### Frontend Tests
```bash
cd ui
npm test
```

## 📖 Documentation

- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [User Stories](docs/USER_STORIES.md)
- [Architecture ⇄ Code Mapping](docs/ARCHITECTURE_TO_CODE_MAP.md)
- [Unified Platform README](UNIFIED_PLATFORM_README.md)
- [Enhanced Orchestration README](ENHANCED_ORCHESTRATION_README.md)
- [Agency Onboarding README](AGENCY_ONBOARDING_README.md)
- [Policy Distribution README](POLICY_DISTRIBUTION_SYSTEM_README.md)
- [Hierarchical System README](HIERARCHICAL_SYSTEM_README.md)
- [Validation System README](VALIDATION_SYSTEM_README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation files

## 🔄 Version History

- **v2.0.0** - Enhanced Orchestration Engine & Unified Platform
- **v1.5.0** - Policy Distribution & Agency Onboarding
- **v1.0.0** - Initial release with core AI agents

---

**AICOMPLYR** - Intelligent AI Governance for the Modern Enterprise 