# AIComplyr.io - Intelligent AI Compliance & Governance System

<div align="center">
  <img src="ui/logo-hummingbird.png" alt="AIComplyr.io Logo" width="200"/>
  
  **Enterprise-grade AI compliance and policy management for marketing agencies and healthcare organizations**
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue)](https://www.postgresql.org/)
</div>

---

## 🚀 Overview

AIComplyr.io is an intelligent compliance system designed to help organizations navigate the complex landscape of AI tool usage in regulated industries. It provides real-time policy evaluation, conflict detection, and comprehensive audit trails to ensure compliance with industry regulations and organizational policies.

### Key Features

- **🧠 Intelligent Context Analysis** - Understands urgency, context, and user intent
- **📋 Dynamic Policy Management** - Create, manage, and enforce AI usage policies
- **🤝 Multi-Client Negotiation** - Handle competitive conflicts and client-specific requirements
- **🔍 Conflict Detection** - Automatically identify and resolve policy conflicts
- **📊 Comprehensive Audit Trails** - Complete decision history for regulatory compliance
- **🎯 Real-time Risk Assessment** - Evaluate requests against multiple risk factors
- **🏢 Enterprise Ready** - Multi-organization support with role-based access control

---

## 📚 Documentation

### Quick Links

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[UI Documentation](./UI_DOCUMENTATION.md)** - Frontend components and integration guide
- **[Technical Architecture](./TECHNICAL_PARTNER_REPORT.md)** - System design and architecture

---

## 🏗️ Architecture

```mermaid
graph TB
    UI[Web UI] --> API[API Server]
    API --> CA[Context Agent]
    API --> PA[Policy Agent]
    API --> NA[Negotiation Agent]
    API --> CDA[Conflict Detection Agent]
    API --> AA[Audit Agent]
    
    CA --> DB[(PostgreSQL)]
    PA --> DB
    NA --> DB
    CDA --> DB
    AA --> DB
    
    subgraph "AI Agents"
        CA
        PA
        NA
        CDA
        AA
    end
```

### Components

1. **Web UI** - Professional dashboard for compliance management
2. **API Server** - RESTful API with JWT authentication
3. **AI Agents** - Specialized agents for different compliance tasks
4. **Database** - PostgreSQL for persistent storage

---

## 🚦 Getting Started

### Prerequisites

- Node.js 14+ 
- PostgreSQL 13+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/aicomplyr-intelligence.git
   cd aicomplyr-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb aicomplyr
   
   # Run migrations
   npm run migrate
   
   # Seed sample data (optional)
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

### Quick Test

```bash
# Test the API
curl http://localhost:3000/api/health

# Test with sample request
curl -X POST http://localhost:3000/api/analyze-conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "policies": [
      {"name": "Policy A", "content": "All AI tools must be approved"},
      {"name": "Policy B", "content": "Emergency use is permitted"}
    ]
  }'
```

---

## 💡 Usage Examples

### 1. Analyzing a User Request

```javascript
// Process a user request through the complete workflow
const request = "Need to use ChatGPT for Monday's presentation!!!";

// 1. Context Analysis
const contextResponse = await fetch('/api/process/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userMessage: request })
});

// 2. Policy Evaluation  
const policyResponse = await fetch('/api/process/policy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contextOutput: await contextResponse.json() })
});

// 3. Get decision
const decision = await policyResponse.json();
console.log(`Decision: ${decision.decision.status}`);
```

### 2. Detecting Policy Conflicts

```javascript
const policies = [
  { name: "Standard Policy", content: "Approval required for all AI tools" },
  { name: "Emergency Policy", content: "Immediate use allowed in emergencies" }
];

const conflicts = await fetch('/api/analyze-conflicts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ policies })
});

const report = await conflicts.json();
console.log(`Found ${report.data.summary.conflicts_found} conflicts`);
```

---

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aicomplyr

# Authentication
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# AI Service (optional)
AI_SERVICE_URL=https://api.openai.com/v1
AI_API_KEY=your-api-key
```

### Policy Configuration

Policies can be configured through the Policy Builder UI or API:

```javascript
const policy = {
  name: "AI Tool Usage Policy",
  riskProfiles: {
    low: { threshold: 0.3, autoApprove: true },
    medium: { threshold: 0.7, requiresReview: true },
    high: { threshold: 0.9, requiresExecutiveApproval: true }
  },
  rules: [
    { type: "tool", value: "chatgpt", risk: 0.5 },
    { type: "content_type", value: "client_presentation", risk: 0.8 }
  ]
};
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:agents
npm run test:api
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── agents/          # Agent unit tests
├── api/            # API endpoint tests
├── integration/    # Full workflow tests
└── fixtures/       # Test data
```

---

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t aicomplyr .
docker run -p 3000:3000 --env-file .env aicomplyr
```

### Production Checklist

- [ ] Set strong JWT_SECRET and SESSION_SECRET
- [ ] Configure PostgreSQL with SSL
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Review security headers
- [ ] Set up rate limiting

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install dev dependencies
npm install --save-dev

# Run in development mode
npm run dev

# Run linter
npm run lint

# Format code
npm run format
```

---

## 📈 Roadmap

### Current Version (v1.0)
- ✅ Core compliance workflow
- ✅ Multi-agent architecture
- ✅ Web dashboard
- ✅ REST API

### Upcoming Features (v2.0)
- 🔄 Real-time updates via WebSocket
- 🤖 Advanced AI integration
- 📱 Mobile app
- 🔗 Third-party integrations
- 📊 Advanced analytics dashboard
- 🌍 Multi-language support

---

## 🛡️ Security

### Reporting Security Issues

Please report security vulnerabilities to security@aicomplyr.io

### Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Encrypted data at rest
- Audit logging for all actions
- Input validation and sanitization
- CSRF protection
- Rate limiting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with Node.js, Express, and PostgreSQL
- UI powered by vanilla JavaScript and modern CSS
- Icons from Font Awesome
- Special thanks to all contributors

---

## 📞 Support

- **Documentation**: [docs.aicomplyr.io](https://docs.aicomplyr.io)
- **Email**: support@aicomplyr.io
- **Issues**: [GitHub Issues](https://github.com/your-org/aicomplyr/issues)
- **Community**: [Discord Server](https://discord.gg/aicomplyr)

---

<div align="center">
  Made with ❤️ by the AIComplyr.io Team
</div>