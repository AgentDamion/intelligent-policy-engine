class GuardrailOrchestratorAgent {
  constructor() {
    this.name = 'guardrail-orchestrator';
  }

  async process(input, context = {}) {
    const violations = [];

    const text = JSON.stringify(input || {});

    // Simple PII check (placeholder)
    const piiPatterns = [/\b\d{3}-\d{2}-\d{4}\b/, /\bssn\b/i];
    if (piiPatterns.some((re) => re.test(text))) {
      violations.push({ type: 'pii', message: 'Potential PII detected' });
    }

    // Safety keyword check (placeholder)
    const unsafe = /(hate|violence|self-harm)/i;
    if (unsafe.test(text)) {
      violations.push({ type: 'safety', message: 'Unsafe content detected' });
    }

    // Relevance check: ensure response references request type
    if (context?.requestType && !text.toLowerCase().includes(String(context.requestType).toLowerCase())) {
      violations.push({ type: 'relevance', message: 'Output may be off-topic' });
    }

    return {
      ok: violations.length === 0,
      violations,
      confidence: violations.length === 0 ? 0.95 : 0.6
    };
  }
}

module.exports = GuardrailOrchestratorAgent;
