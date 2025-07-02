# AICombly.io - Intelligent Compliance System UI

A professional, compliance-focused dashboard that demonstrates intelligent policy management through Context Agent and Policy Agent integration.

## Features

### 🧠 Context Agent Intelligence
- **Urgency Detection**: Analyzes exclamation marks, urgency words, and timing
- **Context Inference**: Identifies presentation types with confidence scoring
- **Smart Clarification**: Generates contextual questions (not generic ones)
- **Emotional State Recognition**: Detects user stress levels and urgency

### 🔒 Policy Agent Intelligence
- **Risk Assessment**: Multi-factor risk scoring based on context
- **Conditional Approvals**: Smart decisions with appropriate guardrails
- **Monitoring Requirements**: Real-time oversight and audit trails
- **Compliance Integration**: GDPR, CCPA, brand guidelines, client confidentiality

### 🎨 Professional UI Design
- **Compliance Dashboard**: Clean, trustworthy design suitable for enterprise
- **Real-time Analysis**: Live urgency meters, confidence bars, risk indicators
- **Clear Decision Display**: Approval status, guardrails, monitoring requirements
- **Actionable Next Steps**: Specific, prioritized action items

## Demo Scenario

**User Input**: "Need to use ChatGPT for Monday's presentation!!!"

**Context Agent Analysis**:
- Urgency: 100% (panicked)
- Context: Client Presentation (70% confidence)
- Smart Question: "Is this for the Johnson & Co. quarterly review we've been prepping?"

**Policy Agent Decision**:
- Status: APPROVED (conditional_approval)
- Risk Level: HIGH (75%)
- Guardrails: Content review, time limits, quality checks, client approval, weekend monitoring
- Monitoring: Usage tracking, real-time quality monitoring, client feedback

## How to Run

### Option 1: Simple HTTP Server
```bash
cd ui
python -m http.server 8000
# or
npx http-server -p 8000
```

### Option 2: Live Server (VS Code)
1. Install Live Server extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Opening
Simply open `ui/index.html` in your browser (some features may be limited)

## Architecture

```
User Input → Context Agent → Policy Agent → UI Display
     ↓           ↓              ↓            ↓
  "Need ChatGPT" → Urgency Analysis → Risk Assessment → Professional Dashboard
  for Monday!!!" → Context Inference → Guardrails → Clear Next Steps
```

## Key Intelligence Features

### 1. Context Awareness
- Recognizes urgency patterns (exclamation marks, urgency words)
- Infers presentation types based on user role and message content
- Generates contextual clarifying questions
- Calculates confidence levels with reasoning

### 2. Risk-Based Decision Making
- Multi-factor risk scoring (urgency, presentation type, timing, tool usage)
- Conditional approvals with specific guardrails
- Escalation requirements for high-risk requests
- Mitigation strategies for identified risks

### 3. Professional Compliance
- Data privacy compliance (GDPR, CCPA)
- Brand guideline adherence
- Client confidentiality protection
- Audit trails and monitoring requirements

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Professional compliance dashboard styling
- **Icons**: Font Awesome
- **Typography**: Inter font family
- **Responsive**: Mobile-friendly design

## Demo Instructions

1. Open the UI in your browser
2. The demo request is pre-populated: "Need to use ChatGPT for Monday's presentation!!!"
3. Click "Analyze Request" to see the full workflow
4. Observe the intelligence:
   - Urgency detection and emotional state
   - Context inference with confidence
   - Smart clarifying question
   - Risk assessment and policy decision
   - Specific guardrails and monitoring
   - Actionable next steps

## Integration Points

The UI is designed to integrate with the existing JavaScript agents:
- `../agents/context-agent.js` - Context analysis and inference
- `../agents/policy-agent.js` - Risk assessment and policy decisions
- `../agents/full-workflow-test.js` - End-to-end testing

## Professional Compliance Features

- **Trustworthy Design**: Professional color palette and typography
- **Clear Decision Display**: Approval status with reasoning
- **Risk Visualization**: Meter-based risk and urgency indicators
- **Guardrail Management**: Required vs optional compliance measures
- **Monitoring Dashboard**: Real-time oversight requirements
- **Audit Trail**: Complete decision documentation

This UI demonstrates how intelligent compliance systems can be both powerful and user-friendly, making complex policy decisions transparent and actionable. 