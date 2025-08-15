# AICOMPLYR Demo Data System

A comprehensive demo data system for AICOMPLYR that generates realistic pharma/agency scenarios with authentic compliance data and time-based metrics.

## 🎯 Overview

The demo system provides realistic scenarios for pharmaceutical companies and their agency partners, complete with:
- **5 Major Pharma Companies** (Pfizer, J&J, Novartis, Merck, Roche)
- **5 Agency Partner Ecosystems** with different specializations
- **Authentic Compliance Scenarios** and policy violations
- **Time-based ROI Metrics** showing before/after AICOMPLYR implementation
- **Multiple User Personas** (compliance officer, agency admin, seat user)

## 📁 File Structure

```
demo/
├── demo-data-generator.js    # Core demo data generation
├── demo-store.js            # Zustand state management
├── DemoIntegration.jsx      # React integration component
└── README.md               # This documentation
```

## 🏢 Pharma Company Scenarios

### Pfizer Marketing
- **Industry**: Pharmaceutical
- **Employees**: 78,000
- **Agency Partners**: 12
- **Monthly AI Spend**: $245,000
- **Compliance Score**: 94%
- **Risk Level**: Medium
- **Therapeutic Areas**: Oncology, Cardiovascular, Vaccines, Rare Diseases

### Johnson & Johnson Consumer
- **Industry**: Consumer Health
- **Employees**: 52,000
- **Agency Partners**: 8
- **Monthly AI Spend**: $180,000
- **Compliance Score**: 91%
- **Risk Level**: High
- **Therapeutic Areas**: Consumer Health, Medical Devices, Pharmaceuticals

### Novartis Global
- **Industry**: Pharmaceutical
- **Employees**: 108,000
- **Agency Partners**: 15
- **Monthly AI Spend**: $320,000
- **Compliance Score**: 96%
- **Risk Level**: Low
- **Therapeutic Areas**: Oncology, Cardiovascular, Neuroscience, Immunology

### Merck & Co. (MSD)
- **Industry**: Pharmaceutical
- **Employees**: 69,000
- **Agency Partners**: 10
- **Monthly AI Spend**: $195,000
- **Compliance Score**: 93%
- **Risk Level**: Medium
- **Therapeutic Areas**: Oncology, Vaccines, Infectious Diseases, Cardiovascular

### Roche Pharmaceuticals
- **Industry**: Pharmaceutical
- **Employees**: 101,000
- **Agency Partners**: 14
- **Monthly AI Spend**: $280,000
- **Compliance Score**: 95%
- **Risk Level**: Low
- **Therapeutic Areas**: Oncology, Neurology, Immunology, Infectious Diseases

## 🎨 Agency Partner Ecosystems

### Ogilvy Health
- **Role**: Full-Service Creative
- **Specialization**: Brand campaigns, social media, content creation
- **Team Size**: 25
- **AI Tools**: Midjourney, ChatGPT, Runway, Adobe Firefly, DALL-E
- **Monthly Submissions**: 45
- **Approval Rate**: 89%
- **Compliance Score**: 87%

### McCann Health
- **Role**: Medical Communications
- **Specialization**: Scientific content, medical education
- **Team Size**: 18
- **AI Tools**: Claude, Grammarly, Synthesia, Jasper
- **Monthly Submissions**: 32
- **Approval Rate**: 95%
- **Compliance Score**: 94%

### Razorfish Health
- **Role**: Digital Experience
- **Specialization**: Web development, digital campaigns, UX
- **Team Size**: 12
- **AI Tools**: GitHub Copilot, Figma AI, ChatGPT, CodeWhisperer
- **Monthly Submissions**: 28
- **Approval Rate**: 92%
- **Compliance Score**: 91%

### Havas Health
- **Role**: Integrated Communications
- **Specialization**: PR, media relations, stakeholder communications
- **Team Size**: 20
- **AI Tools**: ChatGPT, Jasper, Copy.ai, Grammarly
- **Monthly Submissions**: 38
- **Approval Rate**: 88%
- **Compliance Score**: 85%

### Publicis Health
- **Role**: Strategic Consulting
- **Specialization**: Market access, pricing, reimbursement
- **Team Size**: 15
- **AI Tools**: ChatGPT, Claude, Perplexity, Bard
- **Monthly Submissions**: 22
- **Approval Rate**: 97%
- **Compliance Score**: 96%

## ⚠️ Compliance Scenarios

### High-Risk Scenarios
1. **Social Media Medical Claim** - Unsubstantiated efficacy claims
2. **Patient Data Privacy Concern** - HIPAA compliance issues
3. **Off-Label Indication Risk** - FDA off-label promotion violations

### Medium-Risk Scenarios
1. **Potential Copyright Infringement** - AI-generated image conflicts
2. **Competitive Intelligence Risk** - Trade secret protection

## 📊 ROI Metrics

### Before AICOMPLYR
- **Time to Approval**: 12-15 days
- **Compliance Score**: 79% (average)
- **Admin Time**: 35 hours/week
- **Risk Incidents**: 8-12 per month
- **Annual Cost**: $300,000 (incidents + admin time)

### After AICOMPLYR
- **Time to Approval**: 2-3 days (80% faster)
- **Compliance Score**: 94% (average, +15 points)
- **Admin Time**: 8 hours/week (77% reduction)
- **Risk Incidents**: 0-2 per month (85% reduction)
- **Annual Savings**: $127,000

## 👥 User Personas

### Compliance Officer
- **Name**: Dr. Sarah Chen (Pfizer)
- **Role**: Chief Compliance Officer
- **Responsibilities**: Oversee AI compliance, review high-risk content, conduct audits
- **Metrics**: 45 approvals/month, 1.2hr average review time, 94% compliance score

### Agency Admin
- **Name**: Alex Johnson (Ogilvy Health)
- **Role**: Creative Director
- **Responsibilities**: Lead creative team, ensure compliance, train on AI tools
- **Metrics**: 23 submissions/month, 89% approval rate, 8 team members

### Seat User
- **Name**: Maria Garcia (Ogilvy Health)
- **Role**: Social Media Manager
- **Responsibilities**: Create AI content, ensure compliance, track engagement
- **Metrics**: 45 posts/month, 87% approval rate, 2.3% engagement

### Enterprise Admin
- **Name**: Michael Rodriguez (J&J Consumer)
- **Role**: Enterprise Administrator
- **Responsibilities**: Manage policies, oversee agencies, generate reports
- **Metrics**: 8 agencies managed, 156 total users, $180k monthly spend

## 🚀 Usage

### Basic Integration

```javascript
import { useDemoStore, createDemoData } from './demo';

// Initialize demo data
const demoData = createDemoData();

// Use demo store
const { 
  currentScenario, 
  switchDemoScenario, 
  getDemoAnalytics 
} = useDemoStore();
```

### React Component Integration

```jsx
import DemoIntegration from './demo/DemoIntegration';

function App() {
  return (
    <div>
      <DemoIntegration onScenarioChange={(scenario) => {
        console.log('Switched to scenario:', scenario);
      }} />
    </div>
  );
}
```

### API Service Integration

```javascript
import { demoApiService } from './demo';

// Simulate API calls
const contexts = await demoApiService.getDemoData('/user/contexts');
const analytics = await demoApiService.getDemoData('/dashboard/enterprise/pfizer-marketing');
```

## 📈 Demo Features

### Real-time Activity Simulation
- Automatic generation of realistic activities
- Compliance alerts and notifications
- Policy updates and approvals
- User interaction tracking

### Scenario Switching
- Switch between different pharma companies
- View different agency ecosystems
- Compare compliance metrics
- Track ROI improvements

### Content Generation
- AI-powered content creation simulation
- Compliance scoring
- Tool usage tracking
- Approval workflow simulation

### Analytics Dashboard
- Real-time compliance metrics
- Agency performance tracking
- Cost savings calculations
- Risk incident monitoring

## 🔧 Configuration

### Customizing Demo Data

```javascript
// Modify pharma companies
import { pharmaCompanies } from './demo-data-generator';

const customPharmaCompanies = pharmaCompanies.map(company => ({
  ...company,
  complianceScore: company.complianceScore + 5, // Boost all scores
  monthlyAISpend: company.monthlyAISpend * 1.2 // Increase AI spend
}));
```

### Adding New Scenarios

```javascript
// Add new pharma company
const newCompany = {
  id: 'astrazeneca-global',
  name: 'AstraZeneca Global',
  type: 'pharma',
  industry: 'Pharmaceutical',
  employees: 76000,
  agencyPartners: 11,
  monthlyAISpend: 220000,
  complianceScore: 93,
  riskLevel: 'medium',
  // ... other properties
};

pharmaCompanies.push(newCompany);
```

## 📊 Data Export

```javascript
import { useDemoStore } from './demo';

const { exportDemoData } = useDemoStore();
const demoExport = exportDemoData();

// Export includes:
// - Session data
// - User interactions
// - Analytics metrics
// - Timestamp
```

## 🎯 Demo Scenarios

### Scenario 1: Pfizer Marketing
- **Focus**: High-volume social media campaigns
- **Challenge**: Medical claim compliance
- **Solution**: AI-powered claim detection
- **Outcome**: 94% compliance, 80% faster approvals

### Scenario 2: J&J Consumer
- **Focus**: Consumer health marketing
- **Challenge**: Off-label promotion risks
- **Solution**: Regulatory compliance monitoring
- **Outcome**: 91% compliance, 85% incident reduction

### Scenario 3: Novartis Global
- **Focus**: Scientific communications
- **Challenge**: Complex regulatory requirements
- **Solution**: Multi-jurisdiction compliance
- **Outcome**: 96% compliance, 97% approval rate

## 🔄 Real-time Updates

The demo system includes automatic updates that simulate real-world activity:

- **Every 10 seconds**: Random activity generation
- **Every 30 seconds**: Notification updates
- **Every minute**: Compliance score adjustments
- **Every 5 minutes**: Policy update simulations

## 📱 Mobile Responsive

All demo components are designed to work seamlessly across:
- Desktop browsers
- Tablet devices
- Mobile phones
- Touch interfaces

## 🎨 Styling

The demo system includes comprehensive CSS styling for:
- Scenario cards with hover effects
- Analytics dashboards with charts
- Activity feeds with icons
- Notification systems
- Responsive layouts

## 🔒 Security

Demo data is isolated and includes:
- No real user data
- No production API calls
- Local storage only
- Session-based interactions
- Reset functionality

## 📝 License

This demo system is part of the AICOMPLYR platform and is provided for demonstration purposes only. 