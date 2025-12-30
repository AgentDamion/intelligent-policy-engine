import React from 'react'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { testVisibilityLevel } from '../../services/msa/msaVisibilityService'

interface VisibilityPreviewPanelProps {
  level: 'role_only' | 'person_level' | 'full_detail'
  brandId?: string
  roleId?: string
}

const SAMPLE_DATA = {
  actor_id: 'user-123',
  actor_name: 'Sarah Chen',
  actor_email: 'sarah.chen@agency.com',
  actor_role: 'Creative Director',
}

export function VisibilityPreviewPanel({ level, brandId, roleId }: VisibilityPreviewPanelProps) {
  const [preview, setPreview] = React.useState<{
    actor_id: string | null
    actor_name: string | null
    actor_email: string | null
    actor_role: string | null
  } | null>(null)

  React.useEffect(() => {
    testVisibilityLevel(level, SAMPLE_DATA).then((result) => {
      setPreview(result.visible_data)
    })
  }, [level])

  if (!preview) {
    return null
  }

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <h3 className="text-lg font-semibold text-aicomplyr-black">Preview</h3>
        <div className="text-xs text-neutral-500 mt-1">
          What enterprise sees at this visibility level
        </div>
      </EdgeCardHeader>
      <EdgeCardBody>
        <div className="space-y-4">
          {/* Preview Display */}
          <div className="p-4 bg-neutral-100 border-l-4 border-l-aicomplyr-black">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Enterprise View
            </div>
            <div className="space-y-2">
              {preview.actor_id && (
                <div>
                  <div className="text-xs text-neutral-500">Actor ID</div>
                  <div className="text-sm font-mono text-aicomplyr-black">{preview.actor_id}</div>
                </div>
              )}
              {preview.actor_name && (
                <div>
                  <div className="text-xs text-neutral-500">Name</div>
                  <div className="text-sm font-semibold text-aicomplyr-black">{preview.actor_name}</div>
                </div>
              )}
              {preview.actor_email && (
                <div>
                  <div className="text-xs text-neutral-500">Email</div>
                  <div className="text-sm text-aicomplyr-black">{preview.actor_email}</div>
                </div>
              )}
              {preview.actor_role && (
                <div>
                  <div className="text-xs text-neutral-500">Role</div>
                  <div className="text-sm font-semibold text-aicomplyr-black">{preview.actor_role}</div>
                </div>
              )}
              {!preview.actor_id && !preview.actor_name && !preview.actor_email && !preview.actor_role && (
                <div className="text-sm text-neutral-500 italic">No information visible at this level</div>
              )}
            </div>
          </div>

          {/* Comparison */}
          <div className="pt-4 border-t border-neutral-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Visibility Comparison
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${level === 'role_only' ? 'bg-aicomplyr-yellow' : 'bg-neutral-300'}`} />
                <span>Role Only: Shows role title only</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${level === 'person_level' ? 'bg-aicomplyr-yellow' : 'bg-neutral-300'}`} />
                <span>Person Level: Shows name, no role</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${level === 'full_detail' ? 'bg-aicomplyr-yellow' : 'bg-neutral-300'}`} />
                <span>Full Detail: Shows name, role, and email</span>
              </div>
            </div>
          </div>
        </div>
      </EdgeCardBody>
    </EdgeCard>
  )
}

