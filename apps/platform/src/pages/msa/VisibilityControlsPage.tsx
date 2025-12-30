import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEnterprise } from '../../contexts/EnterpriseContext'
import { useBoundaryContext } from '../../hooks/useBoundaryContext'
import BoundaryContextIndicator from '../../components/boundary/BoundaryContextIndicator'
import { VisibilityLevelSelector } from '../../components/msa/VisibilityLevelSelector'
import { BrandVisibilityOverride } from '../../components/msa/BrandVisibilityOverride'
import { RoleVisibilityOverride } from '../../components/msa/RoleVisibilityOverride'
import { VisibilityPreviewPanel } from '../../components/msa/VisibilityPreviewPanel'
import {
  getMSAVisibility,
  createMSAVisibility,
  updateMSAVisibility,
  type MSAVisibilityConfig,
} from '../../services/msa/msaVisibilityService'
import { EdgeCard } from '../../components/ui/edge-card'
import { AICOMPLYRButton } from '../../components/ui/aicomplyr-button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { ArrowLeft, Save } from 'lucide-react'

export default function VisibilityControlsPage() {
  const { agencyId, clientId } = useParams<{ agencyId?: string; clientId?: string }>()
  const navigate = useNavigate()
  const { currentEnterprise } = useEnterprise()
  const boundaryContext = useBoundaryContext()

  const [config, setConfig] = useState<MSAVisibilityConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [visibilityLevel, setVisibilityLevel] = useState<'role_only' | 'person_level' | 'full_detail'>('role_only')
  const [brandOverrides, setBrandOverrides] = useState<Record<string, 'role_only' | 'person_level' | 'full_detail'>>({})
  const [roleOverrides, setRoleOverrides] = useState<Record<string, 'role_only' | 'person_level' | 'full_detail'>>({})
  const [msaReference, setMSAReference] = useState<string>('')
  const [effectiveDate, setEffectiveDate] = useState<string>('')
  const [expirationDate, setExpirationDate] = useState<string>('')

  // Mock brands - in production, fetch from database
  const brands = [
    { id: 'nexium', name: 'Nexium' },
    { id: 'crestor', name: 'Crestor' },
    { id: 'symbicort', name: 'Symbicort' },
  ]

  // Determine agency and client IDs
  const effectiveAgencyId = agencyId || (boundaryContext ? undefined : currentEnterprise?.id) || ''
  const effectiveClientId = clientId || currentEnterprise?.id || ''

  useEffect(() => {
    if (effectiveAgencyId && effectiveClientId) {
      loadConfig()
    }
  }, [effectiveAgencyId, effectiveClientId])

  const loadConfig = async () => {
    if (!effectiveAgencyId || !effectiveClientId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getMSAVisibility(effectiveAgencyId, effectiveClientId)

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is OK for new configs
        throw new Error(fetchError.message || 'Failed to load visibility config')
      }

      if (data) {
        setConfig(data)
        setVisibilityLevel(data.visibility_level)
        setBrandOverrides(data.overrides.brands || {})
        setRoleOverrides(data.overrides.roles || {})
        setMSAReference(data.msa_reference || '')
        setEffectiveDate(data.effective_date || '')
        setExpirationDate(data.expiration_date || '')
      }
    } catch (err) {
      console.error('Error loading config:', err)
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!effectiveAgencyId || !effectiveClientId) {
      setError('Missing agency or client ID')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const configData = {
        agency_enterprise_id: effectiveAgencyId,
        client_enterprise_id: effectiveClientId,
        visibility_level: visibilityLevel,
        overrides: {
          brands: Object.keys(brandOverrides).length > 0 ? brandOverrides : undefined,
          roles: Object.keys(roleOverrides).length > 0 ? roleOverrides : undefined,
        },
        msa_reference: msaReference || undefined,
        effective_date: effectiveDate || undefined,
        expiration_date: expirationDate || undefined,
      }

      let result
      if (config) {
        result = await updateMSAVisibility(config.id, configData)
      } else {
        result = await createMSAVisibility(configData)
      }

      if (result.error) {
        throw new Error(result.error.message || 'Failed to save configuration')
      }

      if (result.data) {
        setConfig(result.data)
        // Show success message or navigate
        navigate('/workflows')
      }
    } catch (err) {
      console.error('Error saving config:', err)
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <BoundaryContextIndicator />
        <div className="container mx-auto px-6 py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <BoundaryContextIndicator />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <AICOMPLYRButton
            variant="tertiary"
            onClick={() => navigate('/workflows')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workflows
          </AICOMPLYRButton>
          <h1 className="text-3xl font-black text-aicomplyr-black tracking-tight">MSA Visibility Controls</h1>
          <p className="text-lg text-neutral-600 mt-1">
            Configure what enterprises see about agency internals
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <EdgeCard variant="attention" className="mb-6">
            <div className="p-4">
              <div className="font-semibold text-status-denied mb-1">Error</div>
              <div className="text-sm text-status-denied">{error}</div>
            </div>
          </EdgeCard>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <VisibilityLevelSelector
              value={visibilityLevel}
              onChange={setVisibilityLevel}
              msaReference={msaReference}
              onMSAReferenceChange={setMSAReference}
              effectiveDate={effectiveDate}
              onEffectiveDateChange={setEffectiveDate}
              expirationDate={expirationDate}
              onExpirationDateChange={setExpirationDate}
            />

            <BrandVisibilityOverride
              brands={brands}
              overrides={brandOverrides}
              onOverrideChange={(brandId, level) => {
                if (level === null) {
                  const newOverrides = { ...brandOverrides }
                  delete newOverrides[brandId]
                  setBrandOverrides(newOverrides)
                } else {
                  setBrandOverrides({ ...brandOverrides, [brandId]: level })
                }
              }}
            />

            <RoleVisibilityOverride
              overrides={roleOverrides}
              onOverrideChange={(roleId, level) => {
                if (level === null) {
                  const newOverrides = { ...roleOverrides }
                  delete newOverrides[roleId]
                  setRoleOverrides(newOverrides)
                } else {
                  setRoleOverrides({ ...roleOverrides, [roleId]: level })
                }
              }}
            />

            {/* Save Button */}
            <div className="flex justify-end">
              <AICOMPLYRButton variant="primary" onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </AICOMPLYRButton>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div>
            <VisibilityPreviewPanel level={visibilityLevel} />
          </div>
        </div>
      </div>
    </div>
  )
}

