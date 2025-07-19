from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import uuid

class GovernanceDecision(BaseModel):
    id: str = str(uuid.uuid4())
    timestamp: datetime = datetime.now(timezone.utc)
    decision_type: str  # "approve", "flag", "modify", "escalate"
    ai_tool_used: str   # "cursor", "claude-3.5", "midjourney", etc.
    regulatory_citation: str  # "FDA 21 CFR 11.10(a)", "EMA GCP 5.1.3"
    human_override: bool = False
    compliance_score: float  # 0.0 to 1.0
    anonymized_context: str
    regulatory_framework: str  # "FDA_21_CFR_11", "EMA_GCP", "ICH_E6"
    pharma_context: bool = True
    agency_relationship: str  # "internal", "external_partner", "client_work"
    public_facing_impact: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class LiveMetrics(BaseModel):
    decisions_today: int
    compliance_rate: float
    total_decisions: int
    last_decision_time: Optional[datetime]
    avg_decision_time: float  # seconds
    policy_conflicts_resolved: int
    regulatory_citations: int
    active_policies: int
    last_updated: datetime = datetime.now(timezone.utc)