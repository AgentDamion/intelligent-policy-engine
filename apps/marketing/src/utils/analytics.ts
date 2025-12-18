export const Events = {
  CTA_CLICK: 'cta_click',
  BUNDLE_FORM_START: 'bundle_form_start',
  BUNDLE_FORM_SUBMIT: 'bundle_form_submit',
  DEMO_CLICK: 'demo_click',
  SCROLL_75: 'scroll_75',
  WP_CARD_CLICK: 'wp_card_click',
  
  // Alternate3 (LP-B) events
  CTA_MIDPAGE_DEMO_CLICKED: 'cta_midpage_demo_clicked',
  CTA_PROOF_SECTION_DEMO_CLICKED: 'cta_proof_section_demo_clicked',
  OBSERVER_BENEFIT_SEEN: 'observer_benefit_seen',
  STICKY_MOBILE_DEMO_CLICKED: 'sticky_mobile_demo_clicked',
  PROOF_POST_DOWNLOAD_PROMPT_SHOWN: 'proof_post_download_prompt_shown',
  PROOF_POST_DOWNLOAD_CTA_CLICKED: 'proof_post_download_cta_clicked',
  FOOTER_DEMO_CLICKED: 'footer_demo_clicked',
  SECURITY_STRIP_SEEN: 'security_strip_seen',
  FAQ_OPENED_ENTERPRISE_PARTNER: 'faq_opened_enterprise_partner',
  FAQ_OPENED_STORE_POLICIES: 'faq_opened_store_policies',
  CALC_EMAIL_RESULTS_CLICKED: 'calc_email_results_clicked',
  PROOF_SPEC_CLICKED: 'proof_spec_clicked',
  PROOF_HASH_COPIED: 'proof_hash_copied',
  
  // Manifesto (Alternate4) events
  MANIFESTO_HERO_SEEN: 'manifesto_hero_seen',
  SEAM_INTERACTION: 'seam_interaction',
  PROBLEM_PANEL_DWELL: 'problem_panel_dwell',
  SOLUTION_PANEL_DWELL: 'solution_panel_dwell',
  CTA_PRIMARY_MANIFESTO_CLICKED: 'cta_primary_manifesto_clicked',
  CTA_SECONDARY_MANIFESTO_CLICKED: 'cta_secondary_manifesto_clicked',
  DAY1_OUTCOMES_SEEN: 'day1_outcomes_seen',
  MANIFESTO_NAV_CLICKED: 'manifesto_nav_clicked'
} as const;

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // PostHog, Mixpanel, or GA4 integration
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(eventName, properties);
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties);
  }
}
