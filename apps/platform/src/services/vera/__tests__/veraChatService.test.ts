import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitVERAQuery, getPolicyExplanation, getComplianceGuidance } from '../veraChatService'
import { supabase } from '../../../lib/supabase'

// Mock supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('VERA Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitVERAQuery', () => {
    it('should submit a query and return formatted response', async () => {
      const mockResponse = {
        result: {
          answer: 'This is a test answer',
          queryType: 'policy_explanation',
          policyReferences: ['policy-1', 'policy-2'],
          confidence: 0.95,
        },
      }

      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      })

      const result = await submitVERAQuery({
        query: 'What is the policy?',
        enterpriseId: 'test-enterprise-id',
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith('cursor-agent-adapter', {
        body: {
          agentName: 'ago-orchestrator',
          action: 'vera-chat',
          input: {
            action: 'vera-chat',
            query: 'What is the policy?',
            context: {},
          },
          enterprise_id: 'test-enterprise-id',
        },
      })

      expect(result).toEqual({
        answer: 'This is a test answer',
        queryType: 'policy_explanation',
        policyReferences: ['policy-1', 'policy-2'],
        relatedTools: [],
        confidence: 0.95,
        suggestedActions: [],
      })
    })

    it('should handle errors from edge function', async () => {
      const mockError = { message: 'Edge function error' }
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: mockError,
      })

      await expect(
        submitVERAQuery({
          query: 'Test query',
          enterpriseId: 'test-enterprise-id',
        })
      ).rejects.toThrow('VERA Chat error: Edge function error')
    })

    it('should handle missing response data', async () => {
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        submitVERAQuery({
          query: 'Test query',
          enterpriseId: 'test-enterprise-id',
        })
      ).rejects.toThrow('No response received from VERA Chat')
    })

    it('should handle backend error responses', async () => {
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Backend processing failed',
        },
        error: null,
      })

      await expect(
        submitVERAQuery({
          query: 'Test query',
          enterpriseId: 'test-enterprise-id',
        })
      ).rejects.toThrow('Backend processing failed')
    })

    it('should include context in request', async () => {
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: {
          result: {
            answer: 'Answer',
            queryType: 'general',
          },
        },
        error: null,
      })

      await submitVERAQuery({
        query: 'Test query',
        enterpriseId: 'test-enterprise-id',
        context: {
          toolId: 'tool-123',
          brand: 'Test Brand',
        },
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'cursor-agent-adapter',
        expect.objectContaining({
          body: expect.objectContaining({
            input: expect.objectContaining({
              context: {
                toolId: 'tool-123',
                brand: 'Test Brand',
              },
            }),
          }),
        })
      )
    })
  })

  describe('getPolicyExplanation', () => {
    it('should generate query for toolId', async () => {
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: {
          result: {
            answer: 'Explanation',
            queryType: 'policy_explanation',
          },
        },
        error: null,
      })

      await getPolicyExplanation('test-enterprise-id', { toolId: 'tool-123' })

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'cursor-agent-adapter',
        expect.objectContaining({
          body: expect.objectContaining({
            input: expect.objectContaining({
              query: 'Why was tool tool-123 approved or rejected?',
            }),
          }),
        })
      )
    })

    it('should generate query for submissionId', async () => {
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: {
          result: {
            answer: 'Explanation',
            queryType: 'policy_explanation',
          },
        },
        error: null,
      })

      await getPolicyExplanation('test-enterprise-id', { submissionId: 'sub-123' })

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'cursor-agent-adapter',
        expect.objectContaining({
          body: expect.objectContaining({
            input: expect.objectContaining({
              query: 'Explain the policy decision for submission sub-123',
            }),
          }),
        })
      )
    })
  })

  describe('getComplianceGuidance', () => {
    it('should submit compliance question with context', async () => {
      ;(supabase.functions.invoke as any).mockResolvedValueOnce({
        data: {
          result: {
            answer: 'Guidance',
            queryType: 'compliance_guidance',
          },
        },
        error: null,
      })

      await getComplianceGuidance(
        'test-enterprise-id',
        'What are the compliance requirements?',
        {
          brand: 'Test Brand',
          region: 'US',
        }
      )

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'cursor-agent-adapter',
        expect.objectContaining({
          body: expect.objectContaining({
            input: expect.objectContaining({
              query: 'What are the compliance requirements?',
              context: {
                brand: 'Test Brand',
                region: 'US',
              },
            }),
          }),
        })
      )
    })
  })
})

