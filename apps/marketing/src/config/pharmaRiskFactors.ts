export const PHARMA_RISK_FACTORS = {
  // Pre-Run Factors (Target: 100 points max)
  PRE_RUN: {
    // Vendor Security (Weighted 1.5x for pharma = 45 pts max)
    VENDOR_SECURITY_ARTIFACTS: {
      key: 'vendor_security_artifacts',
      points: 30,
      description: 'SOC 2 Type II, ISO 27001, or HITRUST certification',
      evidenceRequired: true
    },
    VENDOR_INCIDENT_HISTORY: {
      key: 'vendor_incident_history',
      points: -20,
      description: 'Known security breaches in last 2 years',
      evidenceRequired: false
    },

    // Regulatory Compliance (Weighted 1.3x for pharma)
    FDA_21_CFR_PART_11: {
      key: 'regulatory_fda_21cfr11',
      points: 25,
      description: '21 CFR Part 11 validation documentation',
      evidenceRequired: true
    },
    HIPAA_BAA: {
      key: 'regulatory_hipaa_baa',
      points: 15,
      description: 'Business Associate Agreement signed',
      evidenceRequired: true
    },

    // Policy Coverage (Standard weight)
    POLICY_MATCH_SCORE: {
      key: 'policy_coverage',
      points: 20,
      description: 'Policy requirements coverage',
      evidenceRequired: false
    },

    // IP/Licensing (Standard weight)
    IP_LICENSE_CHECKS: {
      key: 'ip_license_checks',
      points: 15,
      description: 'License permits pharma commercial use',
      evidenceRequired: true
    },

    // Data Classification (Standard weight)
    DATA_CLASS_PUBLIC: {
      key: 'data_class_public',
      points: 25,
      description: 'Public data only',
      evidenceRequired: false
    },
    DATA_CLASS_INTERNAL: {
      key: 'data_class_internal',
      points: 15,
      description: 'Internal/proprietary data',
      evidenceRequired: false
    },
    DATA_CLASS_PII: {
      key: 'data_class_pii',
      points: 5,
      description: 'Contains PII',
      evidenceRequired: false
    },
    DATA_CLASS_PHI: {
      key: 'data_class_phi',
      points: 0,
      description: 'Contains PHI (highest scrutiny)',
      evidenceRequired: false
    },

    // Model Transparency
    MODEL_TRANSPARENCY: {
      key: 'model_transparency',
      points: 10,
      description: 'Open source or documented model architecture',
      evidenceRequired: false
    }
  },

  // In-Run Factors (Delta points, -50 to +50 range)
  IN_RUN: {
    GUARDRAIL_HIT: {
      event: 'guardrail_hit',
      deltaPoints: -15,
      description: 'Content flagged by automated guardrails'
    },
    OVERRIDE_BY_USER: {
      event: 'override',
      deltaPoints: -10,
      description: 'User overrode a policy recommendation'
    },
    HUMAN_REVIEW_COMPLETED: {
      event: 'human_review',
      deltaPoints: +10,
      description: 'Human-in-the-loop review performed'
    },
    DRIFT_ALERT_MINOR: {
      event: 'drift_alert',
      deltaPoints: -5,
      description: 'Minor output drift detected'
    },
    DRIFT_ALERT_MAJOR: {
      event: 'drift_alert_major',
      deltaPoints: -20,
      description: 'Significant output drift from expected behavior'
    },
    AUDIT_LOG_COMPLETE: {
      event: 'audit_log_complete',
      deltaPoints: +15,
      description: 'Complete audit trail maintained per 21 CFR Part 11'
    }
  },

  // Post-Run Factors (Target: 100 points max)
  POST_RUN: {
    MLR_APPROVAL: {
      key: 'mlr_approval',
      points: 30,
      description: 'Medical-Legal-Regulatory approval granted'
    },
    EXCEPTIONS_CLOSED: {
      key: 'exceptions_closed',
      points: 15,
      description: 'All exceptions documented and resolved'
    },
    AUDIT_PACK_COMPLETE: {
      key: 'audit_pack_complete',
      points: 25,
      description: 'FDA-ready audit package generated'
    },
    VALIDATION_PROTOCOL: {
      key: 'validation_protocol',
      points: 20,
      description: 'IQ/OQ/PQ validation completed'
    },
    INCIDENT_REPORTED: {
      key: 'incident',
      points: -30,
      description: 'Security or compliance incident during use'
    }
  }
};
