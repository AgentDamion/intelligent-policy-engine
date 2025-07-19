from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List
import random
from models.governance_decision import GovernanceDecision, LiveMetrics

router = APIRouter()

# Mock data for initial testing - replace with real data later
MOCK_DECISIONS = []

def generate_mock_decisions():
    """Generate realistic mock data for testing"""
    global MOCK_DECISIONS
    
    decision_types = ['approve', 'flag', 'modify', 'escalate']
    tools = ['cursor', 'claude-3.5', 'midjourney', 'chatgpt', 'custom-ai']
    citations = [
        'FDA 21 CFR 11.10(a)',
        'FDA 21 CFR 11.10(b)', 
        'EMA GCP ICH E6 5.1.3',
        'ISO 27001 A.12.6.1',
        'FDA 21 CFR 820.70(i)'
    ]
    frameworks = ['FDA_21_CFR_11', 'EMA_GCP', 'ICH_E6', 'ISO_27001']
    contexts = [
        "AI-generated content review for pharma marketing campaign",
        "Code generation for compliance dashboard feature",
        "Image creation for social media post with drug information",
        "Documentation update using AI writing assistant",
        "Policy recommendation from AI governance engine"
    ]
    
    for i in range(100):  # Generate 100 mock decisions
        MOCK_DECISIONS.append(GovernanceDecision(
            decision_type=random.choice(decision_types),
            ai_tool_used=random.choice(tools),
            regulatory_citation=random.choice(citations),
            human_override=random.choice([True, False]),
            compliance_score=random.uniform(0.85, 1.0),
            anonymized_context=random.choice(contexts),
            regulatory_framework=random.choice(frameworks),
            pharma_context=True,
            agency_relationship=random.choice(['internal', 'external_partner', 'client_work']),
            public_facing_impact=random.choice([True, False]),
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 10080))  # Last week
        ))

@router.get('/live-metrics', response_model=LiveMetrics)
async def get_live_metrics():
    """Real-time governance metrics for homepage widget"""
    
    if not MOCK_DECISIONS:
        generate_mock_decisions()
    
    today = datetime.utcnow().date()
    today_decisions = [d for d in MOCK_DECISIONS if d.timestamp.date() == today]
    
    # Calculate metrics
    total_decisions = len(MOCK_DECISIONS)
    decisions_today = len(today_decisions)
    compliance_rate = (len([d for d in MOCK_DECISIONS if d.compliance_score >= 0.95]) / total_decisions * 100) if total_decisions > 0 else 100
    
    # Policy conflicts (decisions that required human override)
    conflicts_resolved = len([d for d in MOCK_DECISIONS if d.human_override])
    
    # Regulatory citations count
    regulatory_citations = len(set(d.regulatory_citation for d in MOCK_DECISIONS))
    
    # Average decision time (mock)
    avg_decision_time = 2.3  # seconds
    
    # Last decision
    last_decision = max(MOCK_DECISIONS, key=lambda x: x.timestamp) if MOCK_DECISIONS else None
    
    return LiveMetrics(
        decisions_today=decisions_today,
        compliance_rate=round(compliance_rate, 1),
        total_decisions=total_decisions,
        last_decision_time=last_decision.timestamp if last_decision else None,
        avg_decision_time=avg_decision_time,
        policy_conflicts_resolved=conflicts_resolved,
        regulatory_citations=regulatory_citations,
        active_policies=12  # Mock number
    )

@router.get('/recent-decisions')
async def get_recent_decisions(limit: int = 10):
    """Anonymized recent decisions for live feed"""
    
    if not MOCK_DECISIONS:
        generate_mock_decisions()
    
    # Sort by timestamp, get most recent
    recent = sorted(MOCK_DECISIONS, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    return [{
        'id': d.id,
        'timestamp': d.timestamp.isoformat(),
        'type': d.decision_type,
        'tool': d.ai_tool_used,
        'citation': d.regulatory_citation,
        'human_involved': d.human_override,
        'context': d.anonymized_context[:80] + "..." if len(d.anonymized_context) > 80 else d.anonymized_context,
        'compliance_score': round(d.compliance_score, 2),
        'framework': d.regulatory_framework
    } for d in recent]

@router.post('/governance-decision')
async def log_governance_decision(decision: GovernanceDecision):
    """Log a new governance decision (for when you actually use the platform)"""
    
    global MOCK_DECISIONS
    MOCK_DECISIONS.append(decision)
    return {"status": "success", "decision_id": decision.id}