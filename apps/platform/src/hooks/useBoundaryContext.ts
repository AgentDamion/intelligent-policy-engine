import { useState, useEffect } from 'react'
import { useEnterprise } from '@/contexts/EnterpriseContext'
import { useUnifiedAuthContext } from '@/services/auth/unifiedAuthContext'
import { supabase } from '@/lib/supabase'

interface BoundaryContext {
  enterpriseName: string
  partnerName: string
}

export function useBoundaryContext(): BoundaryContext | null {
  const { currentEnterprise } = useEnterprise()
  const { currentContext } = useUnifiedAuthContext()
  const [boundaryContext, setBoundaryContext] = useState<BoundaryContext | null>(null)

  useEffect(() => {
    async function fetchBoundaryContext() {
      if (!currentEnterprise) {
        setBoundaryContext(null)
        return
      }

      try {
        // If we have a partner context, use that
        if (currentContext?.partnerId) {
          const { data: partnerEnterprise, error } = await supabase
            .from('enterprises')
            .select('name')
            .eq('id', currentContext.partnerId)
            .single()

          if (!error && partnerEnterprise) {
            setBoundaryContext({
              enterpriseName: currentEnterprise.name || 'Enterprise',
              partnerName: partnerEnterprise.name || 'Partner',
            })
            return
          }
        }

        // Otherwise, try to find partner relationship from partner_enterprise_relationships
        const { data: relationship, error: relError } = await supabase
          .from('partner_enterprise_relationships')
          .select(`
            partner_enterprise_id,
            partner_enterprise:enterprises!partner_enterprise_relationships_partner_enterprise_id_fkey(name)
          `)
          .eq('client_enterprise_id', currentEnterprise.id)
          .eq('relationship_status', 'active')
          .limit(1)
          .maybeSingle()

        if (!relError && relationship) {
          const partnerName = (relationship.partner_enterprise as any)?.name || 'Partner'
          if (relationship.partner_enterprise_id) {
            setBoundaryContext({
              enterpriseName: currentEnterprise.name || 'Enterprise',
              partnerName,
            })
          } else {
            setBoundaryContext(null)
          }
        } else {
          // No partner relationship found
          setBoundaryContext(null)
        }
      } catch (error) {
        console.error('[useBoundaryContext] Error fetching boundary context:', error)
        setBoundaryContext(null)
      }
    }

    fetchBoundaryContext()
  }, [currentEnterprise, currentContext])

  return boundaryContext
}

