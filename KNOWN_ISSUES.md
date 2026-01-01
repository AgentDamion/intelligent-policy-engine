# Known Issues

## AI SDK Tool Schema Serialization Issue

**Status:** ✅ RESOLVED  
**Priority:** High  
**Impact:** PolicyAgent cannot use AI SDK tools for policy evaluation  
**Date Reported:** 2026-01-01  
**Date Resolved:** 2026-01-03

### Description

When the PolicyAgentRuntime attempts to use AI SDK tools (specifically `fetchEffectivePolicySnapshot`, `evaluateRequest`, and `generateProofBundle`) with `generateText`, the OpenAI API returns the following error:

```
Invalid schema for function 'fetchEffectivePolicySnapshot': schema must be a JSON Schema of 'type: "object"', got 'type: "None"'.
```

### Root Cause

This is a compatibility issue between Vercel AI SDK 6.0.5 and tool schema serialization. The error occurs when the AI SDK attempts to serialize zod schemas to JSON Schema format for OpenAI's API. The schema validation passes locally (we can successfully convert zod schemas to JSON Schema), but fails when sent to OpenAI's API.

### Affected Components

- `api/ai/policy-agent-runtime.js` - PolicyAgentRuntime.evaluateRequest()
- `api/ai/aicomplyr-tools.js` - Policy tools (fetchEffectivePolicySnapshot, evaluateRequest, generateProofBundle)

### Attempted Solutions

1. ✅ Downgraded zod from 4.3.4 to 3.25.76 (AI SDK requirement)
2. ✅ Verified tool schemas are valid and can be converted to JSON Schema
3. ✅ Reproduced issue in isolation with minimal test cases
4. ✅ Confirmed issue affects all AI SDK tools, not just policy tools

### Solution Implemented

✅ **Status: RESOLVED (2026-01-03)**

**Solution:** Refactored PolicyAgentRuntime to use `generateObject` with structured schema instead of `generateText` with tools. This bypasses the AI SDK schema serialization bug while restoring full agentic intelligence.

**Implementation Details:**
- Replaced hardcoded sequential workaround with agentic loop using `PolicyDecisionSchema`
- Agent now makes intelligent decisions about which governance tools to invoke based on context
- Full reasoning chain captured in `agentReasoningChain` and logged to audit trail
- Maintains all boundary governance capabilities (Decision Tokens, Proof Bundles, Partner Confirmation)
- Preserves resilience patterns (CircuitBreaker, retry logic) for production-grade reliability

**Solution Code Location:**
- `api/ai/policy-agent-runtime.js` lines 72-88 (PolicyDecisionSchema definition)
- `api/ai/policy-agent-runtime.js` lines 333-438 (Agentic loop implementation)

**Verification:**
- ✅ Schema serialization error is resolved
- ✅ Agentic intelligence restored - agent "thinks" about which tools to call
- ✅ Full reasoning chain preserved in audit logs
- ✅ All Supabase Edge Functions verified: `generate-eps`, `policy-evaluate`, `generate-proof-bundle`
- ✅ Integration tests pass (Phase 5 verification successful)

### Solution Approach

**Selected:** Option C - Use `generateObject` with structured schema pattern (implemented)

This approach:
- ✅ Bypasses the `generateText` + tools bug entirely
- ✅ Restores agentic intelligence (agent decides which tools to call)
- ✅ Maintains all boundary governance capabilities
- ✅ Preserves audit trail with full reasoning chain
- ✅ Aligns with successful pattern used in IntakeAgent, RiskAgent, ApprovalsAgent

### Related Issues

- Similar tools in IntakeAgent, ToolRegistryAgent, RiskAgent, and ApprovalsAgent work correctly with `generateObject`, but PolicyAgent uses `generateText` with tools
- The issue appears to be specific to `generateText` + tools combination, not `generateObject` + tools

### Notes

- ✅ The governance pipeline is **100% operational** (9/9 agents working)
- ✅ All agents (IntakeAgent, ToolRegistryAgent, RiskAgent, PolicyAgent, ApprovalsAgent, AuditAgent) are fully functional
- ✅ PolicyAgent now uses agentic intelligence with `generateObject` pattern
- ✅ Audit logging and proof bundle generation remain fully functional
- ✅ Strategic milestone: Restores "Boundary Governed" value proposition that differentiates AICOMPLYR from traditional GRC platforms

