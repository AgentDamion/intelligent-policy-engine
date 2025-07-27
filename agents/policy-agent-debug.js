class PolicyAgent {
  async process(data) {
    try {
      const urgencyLevel = data.contextOutput?.urgency?.level || 0.5;
      
      // ADD THIS DEBUG SECTION
      console.log("🚨 DEBUG: Raw data received:");
      console.log("  - data.tool:", JSON.stringify(data.tool));
      console.log("  - data.vendor:", JSON.stringify(data.vendor));
      console.log("  - data.dataHandling:", JSON.stringify(data.dataHandling));
      console.log("  - data.usage:", JSON.stringify(data.usage));
      console.log("  - Object.keys(data):", Object.keys(data));
      
      const riskScore = this.calculateEnhancedRiskScore({
        tool: data.tool,
        vendor: data.vendor,
        usage: data.usage,
        dataHandling: data.dataHandling,
        urgencyLevel
      });
      
      // ... rest of your existing code
