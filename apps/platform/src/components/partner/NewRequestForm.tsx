import React, { useState, useEffect } from 'react'
import { EdgeCard, EdgeCardBody } from '../ui/edge-card'
import { AICOMPLYRButton } from '../ui/aicomplyr-button'
import type { ToolRequest } from '../../services/partner/requestSubmissionService'

interface NewRequestFormProps {
  initialData?: Partial<ToolRequest>
  onSubmit: (request: ToolRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  onChange?: (request: Partial<ToolRequest>) => void
}

const USE_CASES = [
  'HCP Campaign',
  'Patient Materials',
  'Internal Documentation',
  'Social Media Content',
  'Website Content',
  'Email Campaign',
  'Other',
]

export function NewRequestForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  onChange,
}: NewRequestFormProps) {
  const [formData, setFormData] = useState<Partial<ToolRequest>>({
    tool_name: initialData?.tool_name || '',
    tool_version: initialData?.tool_version || '',
    use_case: initialData?.use_case || '',
    brand_id: initialData?.brand_id,
    description: initialData?.description || '',
    urgency: initialData?.urgency || 'normal',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (onChange) {
      onChange(formData)
    }
  }, [formData, onChange])

  const handleChange = (field: keyof ToolRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.tool_name || formData.tool_name.trim().length === 0) {
      newErrors.tool_name = 'Tool name is required'
    }

    if (!formData.tool_version || formData.tool_version.trim().length === 0) {
      newErrors.tool_version = 'Tool version is required'
    }

    if (!formData.use_case || formData.use_case.trim().length === 0) {
      newErrors.use_case = 'Use case is required'
    }

    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    await onSubmit(formData as ToolRequest)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <EdgeCard>
        <EdgeCardBody>
          <div className="space-y-4">
            {/* Tool Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Tool Name <span className="text-status-denied">*</span>
              </label>
              <input
                type="text"
                value={formData.tool_name || ''}
                onChange={(e) => handleChange('tool_name', e.target.value)}
                placeholder="e.g., Midjourney, ChatGPT, DALL-E"
                className={`w-full px-4 py-2 border border-neutral-300 bg-white text-sm ${
                  errors.tool_name ? 'border-status-denied' : ''
                }`}
              />
              {errors.tool_name && (
                <div className="text-xs text-status-denied mt-1">{errors.tool_name}</div>
              )}
            </div>

            {/* Tool Version */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Tool Version <span className="text-status-denied">*</span>
              </label>
              <input
                type="text"
                value={formData.tool_version || ''}
                onChange={(e) => handleChange('tool_version', e.target.value)}
                placeholder="e.g., v6.1, GPT-4, DALL-E 3"
                className={`w-full px-4 py-2 border border-neutral-300 bg-white text-sm ${
                  errors.tool_version ? 'border-status-denied' : ''
                }`}
              />
              {errors.tool_version && (
                <div className="text-xs text-status-denied mt-1">{errors.tool_version}</div>
              )}
            </div>

            {/* Use Case */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Use Case <span className="text-status-denied">*</span>
              </label>
              <select
                value={formData.use_case || ''}
                onChange={(e) => handleChange('use_case', e.target.value)}
                className={`w-full px-4 py-2 border border-neutral-300 bg-white text-sm ${
                  errors.use_case ? 'border-status-denied' : ''
                }`}
              >
                <option value="">Select use case...</option>
                {USE_CASES.map((useCase) => (
                  <option key={useCase} value={useCase}>
                    {useCase}
                  </option>
                ))}
              </select>
              {errors.use_case && (
                <div className="text-xs text-status-denied mt-1">{errors.use_case}</div>
              )}
            </div>

            {/* Brand (optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Brand (Optional)
              </label>
              <input
                type="text"
                value={formData.brand_id || ''}
                onChange={(e) => handleChange('brand_id', e.target.value || undefined)}
                placeholder="e.g., Nexium, Crestor"
                className="w-full px-4 py-2 border border-neutral-300 bg-white text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Description <span className="text-status-denied">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe how you plan to use this tool..."
                rows={5}
                className={`w-full px-4 py-2 border border-neutral-300 bg-white text-sm resize-none ${
                  errors.description ? 'border-status-denied' : ''
                }`}
              />
              {errors.description && (
                <div className="text-xs text-status-denied mt-1">{errors.description}</div>
              )}
              <div className="text-xs text-neutral-500 mt-1">
                {formData.description?.length || 0} characters (minimum 10)
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Urgency
              </label>
              <div className="flex gap-3">
                {(['low', 'normal', 'high'] as const).map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={formData.urgency === level}
                      onChange={(e) => handleChange('urgency', e.target.value)}
                      className="accent-aicomplyr-black"
                    />
                    <span className="text-sm text-neutral-700 capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </EdgeCardBody>
      </EdgeCard>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <AICOMPLYRButton type="button" variant="secondary-light" onClick={onCancel} disabled={loading}>
            Cancel
          </AICOMPLYRButton>
        )}
        <AICOMPLYRButton type="submit" variant="primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </AICOMPLYRButton>
      </div>
    </form>
  )
}

