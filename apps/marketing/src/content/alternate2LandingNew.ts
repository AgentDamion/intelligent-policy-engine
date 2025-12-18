export const alternate2ContentNew = {
  announcement: {
    icon: "check-circle",
    text: "Approvals accelerated this month",
    valueKey: "currentMonthAccelerations"
  },

  hero: {
    headline: "The AI Tool Approval Acceleration Platform",
    subhead: "From 47 days to 4 days. From maybe to yes. From legal limbo to launched—backed by live operational proof.",
    cta: {
      primary: {
        text: "Calculate Your Approval Velocity →",
        link: "/velocity-calculator"
      },
      secondary: {
        text: "See Live Approvals ▾",
        dropdown: [
          { text: "Proof Center", link: "/proof-center" },
          { text: "Governance Lab", link: "/governance-lab" },
          { text: "Audit Exports", link: "/audit-exports" }
        ]
      }
    },
    kpiTiles: [
      {
        label: "Median approval time",
        valueKey: "medianApprovalDays",
        format: "days",
        sublabel: "last 30 days"
      },
      {
        label: "Fastest approval",
        valueKey: "fastestApprovalHours", 
        format: "hours",
        sublabel: "last 30 days"
      },
      {
        label: "Approvals this month",
        valueKey: "currentMonthApprovals",
        format: "number",
        sublabel: "last 30 days"
      },
      {
        label: "System confidence",
        valueKey: "systemConfidencePct",
        format: "percentage",
        sublabel: "last 30 days"
      }
    ]
  },

  approvalComparison: {
    header: "Approval cycles are broken.",
    leftCard: {
      title: "Day 47: Still waiting",
      status: "warning",
      bullets: [
        "Legal review pending",
        "Missing documentation (DPIA/SCC)",
        "Email threads multiplying", 
        "No audit chain"
      ]
    },
    rightCard: {
      title: "Day 4: Approved & shipped",
      status: "success",
      bullets: [
        "Deterministic routing + human approval",
        "Policy match + risk prechecks",
        "Evidence packet generated",
        "Audit trail locked"
      ]
    },
    badges: ["10.7× faster approvals", "Zero black-box steps"]
  },

  processRail: {
    header: "From weeks to days.",
    steps: [
      {
        title: "Submit",
        tooltip: "Structured tool questionnaire & evidence intake (Documentation Hub)."
      },
      {
        title: "Route", 
        tooltip: "Deterministic policy match & risk scoring."
      },
      {
        title: "Review",
        tooltip: "Human-in-the-loop with SLAs and escalations."
      },
      {
        title: "Approve",
        tooltip: "Decision captured with rationale; artifacts locked."
      },
      {
        title: "Ship",
        tooltip: "Publish approval; notify stakeholders; audit entry created."
      }
    ],
    comparison: {
      traditional: {
        title: "Traditional Process",
        description: "47 days (manual, fragmented, slow)"
      },
      platform: {
        title: "With aicomplyr.io",
        description: "4 days (automated, unified, fast)"
      }
    },
    cta: {
      text: "Calculate Your Approval Velocity →",
      link: "/velocity-calculator"
    }
  },

  proofSection: {
    header: "Proof, not promises.",
    copy: "No black boxes. Human-in-the-loop—people decide; platform documents and orchestrates. Deterministic flows, traceable logic, complete audit trails—visible in real time.",
    kpis: [
      {
        label: "Median approval time",
        valueKey: "medianApprovalDays",
        link: "/proof-center?metric=approval-time"
      },
      {
        label: "Fastest approval (hrs)",
        valueKey: "fastestApprovalHours",
        link: "/proof-center?metric=fastest"
      },
      {
        label: "Approvals accelerated (MTD)",
        valueKey: "currentMonthApprovals", 
        link: "/proof-center?metric=monthly"
      },
      {
        label: "Value unlocked ($)",
        valueKey: "valueUnlockedUsd",
        link: "/proof-center?metric=value"
      }
    ],
    verifiedChips: [
      "Human-approved decisions",
      "Zero black-box routing", 
      "Real-time audit visibility"
    ]
  },

  dualSided: {
    header: "Built for both sides of the approval table.",
    enterprise: {
      title: "Enterprise",
      bullets: [
        {
          title: "Documentation Hub",
          description: "Every tool versioned, evidence intact."
        },
        {
          title: "Policy Engine",
          description: "Templates, risk tiers, enforcement."
        },
        {
          title: "Orchestration", 
          description: "Queues, SLAs, escalations."
        },
        {
          title: "Audit & Proof",
          description: "Immutable log & exports."
        }
      ],
      cta: {
        text: "Start Policy Workspace →",
        link: "/onboarding/enterprise"
      }
    },
    agency: {
      title: "Agency",
      bullets: [
        {
          title: "Client Policies",
          description: "Harmonize multi-client requirements."
        },
        {
          title: "Tool Requests",
          description: "Fewer rejections, faster cycles."
        },
        {
          title: "Velocity Score & Badge",
          description: "Publish readiness for RFPs."
        },
        {
          title: "Trust Center",
          description: "Share live compliance proof."
        }
      ],
      cta: {
        text: "Publish Trust Center →",
        link: "/onboarding/agency"
      }
    }
  },

  trustSection: {
    logoCaption: "From top 20 pharmaceutical brands to global agencies, teams trust aicomplyr.io because speed is meaningless without proof.",
    complianceBadges: [
      {
        title: "SOC 2 readiness",
        link: "/security"
      },
      {
        title: "HIPAA compliance", 
        link: "/security"
      },
      {
        title: "GDPR alignment",
        link: "/policies"
      },
      {
        title: "EU/US data residency",
        link: "/security",
        tooltip: "Data residency options available"
      }
    ]
  },

  finalCTA: {
    header: "Can you afford to stay this slow?",
    subheader: "Every day waiting is a day lost. Accelerate approvals safely, provably, and at scale.",
    cta: {
      primary: {
        text: "Calculate Your Approval Velocity →",
        link: "/velocity-calculator"
      },
      secondary: {
        text: "Book a Governance Lab Session →", 
        link: "/book/governance-lab"
      }
    }
  },

  footer: {
    columns: [
      {
        title: "Product",
        links: [
          { text: "Platform Overview", link: "/platform" },
          { text: "Policy Builder", link: "/policy-builder" },
          { text: "Proof Center", link: "/proof-center" }
        ]
      },
      {
        title: "Solutions", 
        links: [
          { text: "Enterprise", link: "/enterprise" },
          { text: "Agencies", link: "/agencies" }
        ]
      },
      {
        title: "Company",
        links: [
          { text: "About Us", link: "/about" },
          { text: "Investors", link: "/investors" },
          { text: "Contact", link: "/contact" }
        ]
      },
      {
        title: "Trust",
        links: [
          { text: "Security", link: "/security" },
          { text: "Data Handling", link: "/data-handling" },
          { text: "Compliance Playbook", link: "/compliance" },
          { text: "Status", link: "/status" }
        ]
      }
    ],
    legal: "© 2025 aicomplyr.io. Built using its own governance."
  }
};

// Mock data structure
export const mockMetrics = {
  medianApprovalDays: 2.3,
  fastestApprovalHours: 26,
  currentMonthApprovals: 155,
  currentMonthAccelerations: 2846,
  systemConfidencePct: 99.9,
  valueUnlockedUsd: 427775447.22,
  timeseries: [1.8, 2.1, 2.4, 2.3, 2.2, 2.5, 2.3],
  timestamp: new Date().toISOString()
};