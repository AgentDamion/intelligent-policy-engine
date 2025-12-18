export const alternate3Content = {
  // Analytics tracking
  variant: "LP-B-Proof",
  
  // Navigation
  nav: {
    items: [
      { label: "Platform", href: "/platform" },
      { label: "For Enterprise", href: "/enterprise" },
      { label: "For Partners", href: "/partners" },
      { label: "Proof", href: "/proof-center" },
      { label: "Pricing", href: "/pricing" },
      { label: "Resources", href: "/resources" }
    ],
    cta: {
      text: "Request a Demo",
      href: "/contact",
      event: "demo_clicked"
    }
  },
  
  // Hero Section
  hero: {
    headline: "Prove AI Compliance Before MLR—In Days, Not Weeks",
    subhead: "Document partner AI usage, capture human attestations, and generate signed Proof Bundles your reviewers (e.g., MLR) can trust. Policy enforcement available for selected Projects.",
    primaryCTA: {
      text: "See a Proof Bundle (2-min demo)",
      action: "scrollToProof",
      event: "demo_clicked"
    },
    secondaryCTA: {
      text: "Calculate Time Saved",
      action: "scrollToCalculator",
      event: "calculator_started"
    },
    microline: "Role-agnostic: works for Enterprises and Partners."
  },
  
  // Metrics Cards (Qualitative)
  metricsCards: [
    {
      title: "Days, not weeks",
      body: "Reviewer-ready proof packet fast."
    },
    {
      title: "Complete & attested",
      body: "Every submitted asset is documented and human-signed."
    },
    {
      title: "One-click handoff",
      body: "Export Proof to your review flow (PDF/JSON/S3)."
    }
  ],
  
  // How It Works (4-step workflow)
  workflow: {
    sectionTitle: "From documentation to reviewer-ready proof—fast",
    steps: [
      {
        number: 1,
        title: "Document",
        description: "Structured disclosures per Project: tool, version, purpose, region, evidence pointers.",
        mockImage: "/workflow-step-1.png"
      },
      {
        number: 2,
        title: "Attest",
        description: "Named human sign-off; tamper-evident timeline.",
        mockImage: "/workflow-step-2.png"
      },
      {
        number: 3,
        title: "Proof",
        description: "Signed Proof Bundle with claim, scope, actors, disclosures, attestations, hash.",
        mockImage: "/workflow-step-3.png"
      },
      {
        number: 4,
        title: "Export",
        description: "PDF/JSON download, S3/SFTP drop. Veeva/IQVIA adapters optional.",
        mockImage: "/workflow-step-4.png"
      }
    ]
  },
  
  // Governance Approach Selector
  governanceApproach: {
    sectionTitle: "Choose your governance approach",
    caption: "Two ways teams use AICOMPLYR (informational)",
    microcopy: "Informational only—choose per Project in your workspace.",
    leftCard: {
      title: "Documentation & Proof",
      badge: "Default",
      copy: "Run Document → Attest → Proof → Export on every Project. No pre-approval overhead.",
      highlighted: true
    },
    rightCard: {
      title: "Policy Enforcement",
      badge: "Optional",
      copy: "On selected Projects, assign an EPS to add in-run validation and HITL approvals before proof.",
      highlighted: false
    },
    note: "Choose per Project based on your governance requirements."
  },
  
  // Role Configuration (Enterprise & Partners)
  roleConfiguration: {
    sectionTitle: "Works for Enterprise & Partners",
    subtitle: "AICOMPLYR is role-agnostic. Whoever owns the workspace is the Enterprise; invited organizations are Partners.",
    columns: [
      {
        title: "Enterprise = Pharma",
        icon: "building",
        items: [
          "Give scoped Observer access to Partners (read-only proofs)",
          "Create Projects and invite Partners",
          "Require disclosures + attestations",
          "Export Proof Bundles to MLR systems"
        ]
      },
      {
        title: "Enterprise = Vendor",
        icon: "users",
        items: [
          "Invite Partners (pharma) as read-only Observers",
          "Document AI usage across client Projects",
          "Share Proof Bundles—no pre-approval unless requested"
        ]
      }
    ]
  },
  
  // Proof Bundle Spotlight (Key Conversion Section)
  proofBundleSpotlight: {
    sectionTitle: "Portable proof your reviewers can trust",
    mockPDFImage: "/proof-bundle-sample.png",
    bullets: [
      "Audit-ready: claim, scope, actors, disclosures, attestations, hash.",
      "Privacy-aware: evidence pointers instead of raw content.",
      "Fast handoff: one-click export to your review flow."
    ],
    downloads: [
      {
        text: "Download sample PDF",
        href: "/assets/proof-sample.pdf",
        event: "proof_sample_downloaded_pdf",
        variant: "outline"
      },
      {
        text: "Download sample JSON",
        href: "/assets/proof-sample.json",
        event: "proof_sample_downloaded_json",
        variant: "ghost"
      }
    ]
  },
  
  // ROI Calculator Section
  calculator: {
    sectionTitle: "See your time savings — how fast to reviewer-ready proof",
    description: "Calculate how fast you can get to reviewer-ready proof",
    inputs: [
      {
        id: "assetsPerMonth",
        label: "Assets/month touching external AI",
        min: 1,
        max: 100,
        default: 20
      },
      {
        id: "minutesPerAsset",
        label: "Minutes you spend assembling acceptable evidence today (per asset)",
        min: 10,
        max: 240,
        default: 90
      },
      {
        id: "peopleInvolved",
        label: "People involved in approvals/evidence handoff",
        min: 1,
        max: 20,
        default: 5
      },
      {
        id: "reworkPercent",
        label: "Rework % due to missing or incomplete proof",
        min: 0,
        max: 80,
        default: 30
      }
    ],
    outputs: {
      timeSaved: "Time saved per month",
      fewerRework: "Fewer rework loops",
      cycleCompression: "Estimated cycle compression to reviewer-ready"
    },
    cta: {
      text: "Request a Demo",
      href: "/contact",
      event: "demo_clicked"
    }
  },
  
  // FAQ Section
  faq: [
    {
      question: "What's the difference between AI tool approval and compliance proof?",
      answer: "We help teams generate reviewer-ready evidence quickly. Policy enforcement can be added to selected Projects via EPS when needed, but many teams just need fast, complete <a href='#proof-bundle-spotlight' class='text-brand-teal hover:underline'>documentation and attestations</a>."
    },
    {
      question: "Can I use AICOMPLYR without pre-approving tools?",
      answer: "Yes. The core workflow is Document → Attest → Proof → Export. Policy enforcement (pre-run validation, HITL approvals) is optional and applied per Project."
    },
    {
      question: "How do Proof Bundles fit into our MLR process?",
      answer: "Proof Bundles are designed for handoff to your existing review systems. Export as PDF/JSON, upload to your MLR platform, or use our Veeva/IQVIA adapters for automated delivery."
    },
    {
      question: "Who is the Enterprise vs. a Partner?",
      answer: "The workspace owner is the Enterprise (pharma or vendor). Invited orgs are Partners with scoped access per Project."
    },
    {
      question: "Do you store our policies or prompts?",
      answer: "We store disclosures, attestations, and proof manifests. Raw prompts/evidence are referenced via pointers unless you choose to include them."
    }
  ],
  
  // Footer CTA Band
  footerCTA: {
    headline: "See a Proof Bundle in 2 minutes",
    primaryCTA: {
      text: "Request a Demo",
      href: "/contact",
      event: "demo_clicked"
    },
    secondaryCTA: {
      text: "Join ASSURE Beta",
      href: "/contact",
      event: "beta_signup_clicked"
    },
    smallPrint: "Policy enforcement available for selected Projects."
  },
  
  // Footer Navigation
  footer: {
    columns: [
      {
        title: "Product",
        links: [
          { text: "Platform", href: "/platform" },
          { text: "Proof Bundles", href: "/proof-center" },
          { text: "Documentation", href: "/docs" }
        ]
      },
      {
        title: "Solutions",
        links: [
          { text: "For Enterprise", href: "/enterprise" },
          { text: "For Partners", href: "/partners" }
        ]
      },
      {
        title: "Resources",
        links: [
          { text: "Blog", href: "/blog" },
          { text: "Case Studies", href: "/case-studies" },
          { text: "Support", href: "/support" }
        ]
      },
      {
        title: "Company",
        links: [
          { text: "About", href: "/about" },
          { text: "Contact", href: "/contact" },
          { text: "Careers", href: "/careers" }
        ]
      }
    ],
    legal: [
      { text: "Privacy Policy", href: "/privacy" },
      { text: "Terms of Service", href: "/terms" },
      { text: "Security", href: "/security" }
    ],
    copyright: "© 2025 AICOMPLYR.io. All rights reserved."
  }
};
