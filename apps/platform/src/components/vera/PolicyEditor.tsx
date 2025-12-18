/**
 * PolicyEditor Component
 * 
 * A comprehensive policy editor with form fields and rule builder
 * for creating and editing policies in the Policy Studio.
 */

import { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Layers,
  Globe,
  Lock,
  Send
} from 'lucide-react'
import { 
  getPolicy,
  getLatestPublishedVersion,
  createPolicy,
  updatePolicy,
  createPolicyVersion,
  publishPolicyVersion,
  type Policy,
  type PolicyVersion,
  type PolicyRules,
  type PolicyStatus
} from '@/services/vera/policyStudioService'
import toast from 'react-hot-toast'

// =============================================================================
// Types
// =============================================================================

interface PolicyEditorProps {
  enterpriseId: string
  policyId?: string | null
  onClose: () => void
  onSaved: () => void
}

interface RuleItem {
  id: string
  name: string
  condition: string
  action: 'allow' | 'block' | 'flag' | 'require_approval'
  priority: number
}

// =============================================================================
// Rule Builder Component
// =============================================================================

function RuleBuilder({ 
  rules, 
  onChange 
}: { 
  rules: RuleItem[]
  onChange: (rules: RuleItem[]) => void
}) {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  const addRule = () => {
    const newRule: RuleItem = {
      id: `rule-${Date.now()}`,
      name: '',
      condition: '',
      action: 'flag',
      priority: rules.length
    }
    onChange([...rules, newRule])
    setExpandedRules(new Set([...expandedRules, newRule.id]))
  }

  const updateRule = (id: string, updates: Partial<RuleItem>) => {
    onChange(rules.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const removeRule = (id: string) => {
    onChange(rules.filter(r => r.id !== id))
    const newExpanded = new Set(expandedRules)
    newExpanded.delete(id)
    setExpandedRules(newExpanded)
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRules(newExpanded)
  }

  const actionColors: Record<string, string> = {
    allow: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    block: 'bg-red-100 text-red-700 border-red-200',
    flag: 'bg-amber-100 text-amber-700 border-amber-200',
    require_approval: 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No custom rules defined</p>
          <p className="text-xs text-slate-400 mt-1">Add rules to customize policy behavior</p>
        </div>
      ) : (
        rules.map((rule, index) => (
          <div 
            key={rule.id}
            className="border border-slate-200 rounded-lg overflow-hidden"
          >
            {/* Rule Header */}
            <div 
              className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer"
              onClick={() => toggleExpand(rule.id)}
            >
              <span className="text-xs font-mono text-slate-400">#{index + 1}</span>
              <span className="flex-1 font-medium text-slate-700 truncate">
                {rule.name || 'Untitled Rule'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${actionColors[rule.action]}`}>
                {rule.action.replace('_', ' ')}
              </span>
              {expandedRules.has(rule.id) ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {/* Rule Details */}
            {expandedRules.has(rule.id) && (
              <div className="p-4 space-y-4 bg-white">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    placeholder="e.g., Block PHI data processing"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Condition
                  </label>
                  <textarea
                    value={rule.condition}
                    onChange={(e) => updateRule(rule.id, { condition: e.target.value })}
                    placeholder="e.g., data_type == 'PHI' AND jurisdiction == 'US'"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Use logical operators: AND, OR, NOT. Variables: data_type, tool_category, jurisdiction, risk_level
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Action
                    </label>
                    <select
                      value={rule.action}
                      onChange={(e) => updateRule(rule.id, { action: e.target.value as RuleItem['action'] })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="allow">Allow</option>
                      <option value="flag">Flag for Review</option>
                      <option value="require_approval">Require Approval</option>
                      <option value="block">Block</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={rule.priority}
                      onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <button
        onClick={addRule}
        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Custom Rule
      </button>
    </div>
  )
}

// =============================================================================
// Tool Categories Section
// =============================================================================

function ToolCategoriesSection({
  allowed,
  blocked,
  requiresApproval,
  onChange
}: {
  allowed: string[]
  blocked: string[]
  requiresApproval: string[]
  onChange: (field: 'allowed' | 'blocked' | 'requires_approval', values: string[]) => void
}) {
  const [newAllowed, setNewAllowed] = useState('')
  const [newBlocked, setNewBlocked] = useState('')
  const [newApproval, setNewApproval] = useState('')

  const addItem = (field: 'allowed' | 'blocked' | 'requires_approval', value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return
    const current = field === 'allowed' ? allowed : field === 'blocked' ? blocked : requiresApproval
    if (!current.includes(value.trim())) {
      onChange(field, [...current, value.trim()])
    }
    setValue('')
  }

  const removeItem = (field: 'allowed' | 'blocked' | 'requires_approval', value: string) => {
    const current = field === 'allowed' ? allowed : field === 'blocked' ? blocked : requiresApproval
    onChange(field, current.filter(v => v !== value))
  }

  const TagList = ({ items, field, color }: { items: string[], field: 'allowed' | 'blocked' | 'requires_approval', color: string }) => (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span 
          key={item} 
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${color}`}
        >
          {item}
          <button
            onClick={() => removeItem(field, item)}
            className="hover:text-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Allowed */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-500" />
          Allowed Tool Categories
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAllowed}
            onChange={(e) => setNewAllowed(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem('allowed', newAllowed, setNewAllowed)}
            placeholder="e.g., text-generation"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => addItem('allowed', newAllowed, setNewAllowed)}
            className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200"
          >
            Add
          </button>
        </div>
        <TagList items={allowed} field="allowed" color="bg-emerald-100 text-emerald-700" />
      </div>

      {/* Requires Approval */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
          Requires Approval
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newApproval}
            onChange={(e) => setNewApproval(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem('requires_approval', newApproval, setNewApproval)}
            placeholder="e.g., code-generation"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => addItem('requires_approval', newApproval, setNewApproval)}
            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200"
          >
            Add
          </button>
        </div>
        <TagList items={requiresApproval} field="requires_approval" color="bg-amber-100 text-amber-700" />
      </div>

      {/* Blocked */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Lock className="w-4 h-4 inline mr-1 text-red-500" />
          Blocked Tool Categories
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newBlocked}
            onChange={(e) => setNewBlocked(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem('blocked', newBlocked, setNewBlocked)}
            placeholder="e.g., image-generation"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => addItem('blocked', newBlocked, setNewBlocked)}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
          >
            Add
          </button>
        </div>
        <TagList items={blocked} field="blocked" color="bg-red-100 text-red-700" />
      </div>
    </div>
  )
}

// =============================================================================
// Main PolicyEditor Component
// =============================================================================

export function PolicyEditor({ 
  enterpriseId, 
  policyId, 
  onClose, 
  onSaved 
}: PolicyEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'rules' | 'settings'>('details')
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<PolicyStatus>('draft')
  const [jurisdictions, setJurisdictions] = useState<string[]>([])
  
  // Rules state
  const [toolCategories, setToolCategories] = useState({
    allowed: [] as string[],
    blocked: [] as string[],
    requires_approval: [] as string[]
  })
  const [customRules, setCustomRules] = useState<RuleItem[]>([])
  
  // Current version tracking
  const [currentPolicy, setCurrentPolicy] = useState<Policy | null>(null)
  const [currentVersion, setCurrentVersion] = useState<PolicyVersion | null>(null)

  // Load existing policy
  useEffect(() => {
    async function loadPolicy() {
      if (!policyId) {
        setLoading(false)
        return
      }

      try {
        const [policy, version] = await Promise.all([
          getPolicy(policyId),
          getLatestPublishedVersion(policyId)
        ])

        if (policy) {
          setCurrentPolicy(policy)
          setTitle(policy.title)
          setDescription(policy.description || '')
          setStatus(policy.status)
        }

        if (version) {
          setCurrentVersion(version)
          setJurisdictions(version.jurisdictions || [])
          
          const rules = version.rules || {}
          setToolCategories({
            allowed: rules.tool_categories?.allowed || [],
            blocked: rules.tool_categories?.blocked || [],
            requires_approval: rules.tool_categories?.requires_approval || []
          })
          setCustomRules(rules.custom_rules || [])
        }
      } catch (error) {
        console.error('Error loading policy:', error)
        toast.error('Failed to load policy')
      } finally {
        setLoading(false)
      }
    }

    loadPolicy()
  }, [policyId])

  // Build rules object
  const buildRules = (): PolicyRules => ({
    tool_categories: {
      allowed: toolCategories.allowed,
      blocked: toolCategories.blocked,
      requires_approval: toolCategories.requires_approval
    },
    custom_rules: customRules
  })

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Policy title is required')
      return
    }

    setSaving(true)
    try {
      if (policyId && currentPolicy) {
        // Update existing policy
        await updatePolicy(policyId, {
          title,
          description,
          status
        })

        // Create new version with rules
        await createPolicyVersion({
          policy_id: policyId,
          title,
          description,
          rules: buildRules(),
          jurisdictions
        })

        toast.success('Policy updated')
      } else {
        // Create new policy
        await createPolicy({
          title,
          description,
          enterprise_id: enterpriseId,
          status: 'draft',
          initial_rules: buildRules()
        })

        toast.success('Policy created')
      }

      onSaved()
    } catch (error) {
      console.error('Error saving policy:', error)
      toast.error('Failed to save policy')
    } finally {
      setSaving(false)
    }
  }

  // Handle publish
  const handlePublish = async () => {
    if (!currentVersion?.id) {
      toast.error('No version to publish')
      return
    }

    setPublishing(true)
    try {
      await publishPolicyVersion(currentVersion.id)
      toast.success('Policy published')
      onSaved()
    } catch (error) {
      console.error('Error publishing policy:', error)
      toast.error('Failed to publish policy')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            {policyId ? 'Edit Policy' : 'New Policy'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {currentVersion && currentVersion.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-2 border-b border-slate-200 bg-slate-50">
        {[
          { key: 'details', label: 'Details', icon: FileText },
          { key: 'rules', label: 'Rules', icon: Shield },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Policy Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Enterprise AI Governance Policy"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this policy..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Jurisdictions
              </label>
              <input
                type="text"
                value={jurisdictions.join(', ')}
                onChange={(e) => setJurisdictions(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="e.g., US, EU, APAC"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">Comma-separated list of applicable jurisdictions</p>
            </div>

            {currentVersion && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Version Info</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Current Version:</span>
                    <span className="ml-2 font-medium">v{currentVersion.version_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className={`ml-2 font-medium ${
                      currentVersion.status === 'published' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {currentVersion.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Tool Categories
              </h3>
              <ToolCategoriesSection
                allowed={toolCategories.allowed}
                blocked={toolCategories.blocked}
                requiresApproval={toolCategories.requires_approval}
                onChange={(field, values) => setToolCategories(prev => ({ ...prev, [field]: values }))}
              />
            </div>

            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Custom Rules
              </h3>
              <RuleBuilder rules={customRules} onChange={setCustomRules} />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Policy Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PolicyStatus)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Advanced Settings
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Additional settings like inheritance mode, parent policy, and scope 
                configuration are available in the full Policy Studio interface.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PolicyEditor

