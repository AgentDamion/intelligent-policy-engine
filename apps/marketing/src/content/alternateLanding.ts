// Centralized content for the Alternate Landing page
// This enables easy A/B testing and content updates without touching components

export const alternateContent = {
  hero: {
    headline: {
      prefix: "From",
      chaos: "AI Chaos",
      middle: "to",
      clarity: "Compliance Clarity"
    },
    subheadline: "Stop drowning in spreadsheets and manual approvals. Human-in-the-loop—people decide; platform documents and orchestrates—turning chaos into clarity.",
    cta: {
      primary: "Request a Demo Today",
      secondary: "Watch 2-Minute Demo Video"
    }
  },

  stats: {
    title: "Your Teams Can't Keep Up With Manual AI Tool Approvals",
    data: [
      {
        value: "6 weeks",
        label: "Average approval time",
        description: "for each AI tool"
      },
      {
        value: "73%",
        label: "Compliance failures",
        description: "due to manual processes"
      },
      {
        value: "8-12",
        label: "People involved",
        description: "in each approval cycle"
      }
    ]
  },

  gameChanger: {
    title: "Introducing the AI Tool Compliance",
    titleHighlight: "Game Changer",
    steps: [
      {
        number: 1,
        title: "Streamline Submissions",
        subtitle: "(No More Spreadsheets!)",
        description: "Transform chaotic email chains and endless spreadsheets into a streamlined submission workflow. One click submission with automated compliance checking.",
        badge: "10 minutes vs 6 weeks"
      },
      {
        number: 2,
        title: "Ensure Compliance",
        subtitle: "(Without Guessing)",
        description: "Deterministic policy validation against 500+ regulatory frameworks. Auto-prechecks with human approval and audit-ready documentation generated instantly.",
        badge: "Live Proof Center"
      }
    ]
  },

  integrations: {
    title: "One Governance Backbone Across",
    titleHighlight: "500+ Tools",
    subtitle: "Connect your entire AI ecosystem under unified compliance governance. From development to deployment, every tool follows the same standards.",
    statusText: "Unified Compliance Backbone Active"
  },

  benefits: {
    title: "Why Teams",
    titleHighlight: "Love Us",
    subtitle: "Transform your AI governance from a compliance burden into a competitive advantage",
    items: [
      {
        title: "Cut approval times from 6 weeks → 48 hours",
        description: "Deterministic routing with human approval eliminates bottlenecks and accelerates time-to-market for AI initiatives.",
        highlight: "48 hours"
      },
      {
        title: "Eliminate inconsistent decisions (one source of truth)",
        description: "Centralized policy engine ensures every team member applies the same compliance standards across all tools.",
        highlight: "100% consistency"
      },
      {
        title: "Auto-prechecks with human approval and audit-ready documentation",
        description: "Generate comprehensive audit trails and compliance reports that satisfy regulators and internal stakeholders.",
        highlight: "Audit-ready"
      }
    ]
  },

  finalCTA: {
    title: "Ready to Stop",
    titleHighlight: "Wasting Time?",
    subtitle: "Join 500+ teams who've accelerated their AI initiatives. Human-in-the-loop—people decide; platform documents and orchestrates.",
    cta: {
      primary: "Request a Demo: Eliminate Manual Review Delays",
      secondary: "Watch 2-Minute Demo"
    }
  },

  // Configuration
  video: {
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder - update with actual demo video
    title: "2-Minute Demo Video"
  }
};