# Agency Onboarding Portal for aicomplyr.io

A comprehensive agency onboarding system that enables pharmaceutical enterprises to invite marketing agencies, manage relationships, and approve AI tools for compliance with FDA regulations and industry standards.

## 🎯 Business Context

### Problem Statement
- Pharma enterprises need to work with multiple marketing agencies simultaneously
- Each agency must comply with different client policies and FDA regulations
- Agencies submit AI tools that require enterprise approval before use
- Traditional onboarding processes are manual, slow, and lack compliance tracking

### Solution
The Agency Onboarding Portal provides:
- **Streamlined Invitation Process**: Enterprises can invite agencies through a secure portal
- **Compliance Management**: Built-in FDA compliance tracking and validation
- **AI Tool Approval Workflow**: Structured submission and review process for AI tools
- **Relationship Management**: Track agency-enterprise relationships and compliance scores
- **Audit Trail**: Complete logging of all activities for regulatory compliance

## 🏗️ Architecture

### Database Schema

#### Core Tables
```sql
-- Agency invitations
agency_invitations (
  id, enterprise_org_id, agency_email, agency_name, 
  invitation_token, status, invited_by, expires_at, accepted_at
)

-- Agency-Enterprise relationships
agency_enterprise_relationships (
  id, agency_org_id, enterprise_org_id, relationship_status,
  compliance_score, last_audit_date
)

-- AI Tools submissions
agency_ai_tools (
  id, agency_org_id, enterprise_org_id, tool_name, tool_description,
  tool_type, tool_url, compliance_documentation, submission_status
)

-- Compliance requirements
agency_compliance_requirements (
  id, enterprise_org_id, requirement_name, requirement_description,
  requirement_type, is_required, validation_rules
)

-- Onboarding workflow
agency_onboarding_steps (
  id, step_name, step_description, step_order, step_type
)

-- Progress tracking
agency_onboarding_progress (
  id, agency_org_id, enterprise_org_id, step_id, status
)
```

### API Endpoints

#### Enterprise Endpoints
- `POST /api/agency-onboarding/invite` - Send agency invitation
- `GET /api/agency-onboarding/invitations` - List agency invitations
- `POST /api/agency-onboarding/:invitationId/resend` - Resend invitation
- `GET /api/agency-onboarding/dashboard` - Enterprise dashboard
- `POST /api/agency-onboarding/tools/:toolId/review` - Review AI tool

#### Agency Endpoints
- `GET /api/agency-onboarding/accept/:token` - Validate invitation token
- `POST /api/agency-onboarding/register` - Complete agency registration
- `POST /api/agency-onboarding/tools` - Submit AI tool
- `GET /api/agency-onboarding/tools` - List submitted tools
- `GET /api/agency-onboarding/dashboard` - Agency dashboard

## 🚀 Features

### Enterprise Features

#### Agency Invitation Management
- **Send Invitations**: Enterprise admins can invite agencies by email
- **Track Status**: Monitor invitation status (pending, accepted, expired)
- **Resend Invitations**: Extend invitation expiry dates
- **Bulk Operations**: Send multiple invitations simultaneously

#### AI Tool Review
- **Submission Review**: Review AI tools submitted by agencies
- **Compliance Validation**: Check FDA compliance and security measures
- **Approval Workflow**: Approve, reject, or request modifications
- **Audit Trail**: Complete logging of review decisions

#### Dashboard & Analytics
- **Overview Metrics**: Total invitations, active agencies, compliance scores
- **Progress Tracking**: Monitor onboarding completion rates
- **Compliance Monitoring**: Track agency compliance scores over time
- **Performance Analytics**: Review approval rates and processing times

### Agency Features

#### Onboarding Process
- **Registration**: Complete agency profile and contact information
- **Compliance Setup**: Submit required compliance documentation
- **Progress Tracking**: Monitor onboarding step completion
- **Documentation**: Upload required certificates and validations

#### AI Tool Submission
- **Tool Registration**: Submit AI tools with detailed descriptions
- **Compliance Documentation**: Provide FDA compliance and security measures
- **Status Tracking**: Monitor submission and approval status
- **Resubmission**: Update tools based on feedback

#### Dashboard
- **Progress Overview**: Track onboarding completion status
- **Tool Management**: View submitted tools and approval status
- **Compliance Status**: Monitor compliance requirements and scores
- **Relationship Status**: View enterprise relationship status

### Compliance & Security

#### FDA Compliance
- **Regulatory Tracking**: Built-in FDA compliance requirements
- **Documentation Validation**: Required compliance documentation
- **Audit Trail**: Complete activity logging for regulatory review
- **Approval Workflow**: Structured review and approval process

#### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permissions for different user types
- **Data Encryption**: Encrypted data transmission and storage
- **Audit Logging**: Complete audit trail for security compliance

#### Data Privacy
- **GDPR Compliance**: Built-in data privacy controls
- **Data Retention**: Configurable data retention policies
- **Access Controls**: Role-based data access restrictions
- **Privacy Documentation**: Required privacy measure documentation

## 📊 Workflow

### Enterprise Workflow
1. **Identify Agency**: Enterprise identifies marketing agency
2. **Send Invitation**: Send invitation through portal with 7-day expiry
3. **Monitor Registration**: Track agency registration progress
4. **Review Tools**: Review and approve AI tool submissions
5. **Monitor Compliance**: Track ongoing compliance and performance
6. **Manage Relationship**: Maintain active agency relationships

### Agency Workflow
1. **Receive Invitation**: Agency receives invitation email
2. **Complete Registration**: Register and set up agency profile
3. **Submit Compliance**: Provide required compliance documentation
4. **Submit AI Tools**: Submit AI tools for enterprise approval
5. **Track Approval**: Monitor tool approval status
6. **Use Approved Tools**: Use approved tools for marketing campaigns

## 🔧 Technical Implementation

### Frontend Components
- `AgencyOnboardingPortal`: Main portal interface
- `AgencyInviteModal`: Agency invitation form
- `AIToolSubmissionModal`: AI tool submission form
- `AgencyOnboardingDemo`: Demo interface for testing

### Backend API
- **Express.js Routes**: RESTful API endpoints
- **PostgreSQL Database**: Relational database with JSONB support
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Permission-based access control

### Database Features
- **Audit Logging**: Complete activity tracking
- **Dashboard Views**: Optimized views for analytics
- **Indexing**: Performance-optimized database indexes
- **Transactions**: ACID-compliant data operations

## 🎨 User Interface

### Enterprise Dashboard
- **Statistics Cards**: Overview metrics and KPIs
- **Invitation Management**: List and manage agency invitations
- **Tool Review Interface**: Review and approve AI tools
- **Compliance Monitoring**: Track agency compliance scores

### Agency Dashboard
- **Progress Tracking**: Visual onboarding progress indicators
- **Tool Management**: Submit and track AI tools
- **Compliance Status**: Monitor compliance requirements
- **Relationship Overview**: View enterprise relationships

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Accessibility**: WCAG-compliant design
- **Modern UI**: Clean, professional interface
- **Real-Time Updates**: Live status updates and notifications

## 🔒 Security & Compliance

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with expiry
- **Role-Based Access**: Granular permission system
- **Organization Scoping**: Data isolation between organizations
- **Session Management**: Secure session handling

### Data Protection
- **Encryption**: Data encryption in transit and at rest
- **Access Controls**: Role-based data access
- **Audit Logging**: Complete activity audit trail
- **Data Retention**: Configurable retention policies

### Compliance Features
- **FDA Compliance**: Built-in pharmaceutical compliance tracking
- **GDPR Compliance**: Data privacy and protection controls
- **SOC 2 Ready**: Security controls for SOC 2 compliance
- **HIPAA Considerations**: Healthcare data protection measures

## 🚀 Deployment

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd aicomplyr-intelligence

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
node database/migrate.js

# Start development server
npm start
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aicomplyr

# Authentication
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.aicomplyr.io

# JWT
JWT_SECRET=your-jwt-secret

# Server
PORT=3000
NODE_ENV=development
```

## 📈 Monitoring & Analytics

### Dashboard Metrics
- **Invitation Statistics**: Total, pending, accepted invitations
- **Agency Performance**: Compliance scores and approval rates
- **Tool Submission Analytics**: Submission and approval trends
- **Onboarding Progress**: Completion rates and time-to-onboard

### Audit Trail
- **User Actions**: Complete logging of user activities
- **System Events**: System-level event tracking
- **Compliance Events**: Regulatory compliance activities
- **Security Events**: Security-related activities

## 🔮 Future Enhancements

### Planned Features
- **Bulk Operations**: Mass invitation and approval capabilities
- **Advanced Analytics**: Machine learning-powered insights
- **Integration APIs**: Third-party system integrations
- **Mobile App**: Native mobile application
- **Advanced Compliance**: Additional regulatory compliance features

### Scalability Considerations
- **Microservices Architecture**: Service-based architecture
- **Database Sharding**: Horizontal database scaling
- **Caching Layer**: Redis-based caching system
- **CDN Integration**: Content delivery network
- **Load Balancing**: Horizontal scaling capabilities

## 📝 API Documentation

### Authentication
All API endpoints require JWT authentication:
```http
Authorization: Bearer <jwt_token>
```

### Error Handling
Standard HTTP status codes with JSON error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per organization
- Rate limit headers included in responses

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety (future)
- **Jest**: Unit testing
- **Cypress**: Integration testing

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: See inline code documentation
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact support@aicomplyr.io

---

**Built with ❤️ for the pharmaceutical industry** 