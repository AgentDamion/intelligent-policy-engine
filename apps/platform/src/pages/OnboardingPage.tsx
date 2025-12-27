import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useEnterprise } from '../contexts/EnterpriseContext'
import { supabase } from '../lib/supabase'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import RegulatoryFrameworkSelector from '../components/onboarding/RegulatoryFrameworkSelector'

interface OnboardingData {
  enterpriseName: string
  enterpriseType: 'agency' | 'pharma' | 'healthcare' | 'other'
  workspaceName: string
  teamSize: string
  primaryUseCase: string
}

function getSafeRedirectTo(search: string): string | null {
  const raw = new URLSearchParams(search).get('redirectTo')
  if (!raw) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  if (raw.includes('://')) return null
  if (raw.startsWith('/login')) return null
  if (raw.startsWith('/onboarding')) return null
  return raw
}

const OnboardingPage: React.FC = () => {
  const { user } = useAuth()
  const { setCurrentEnterprise } = useEnterprise()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = getSafeRedirectTo(location.search)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'basic' | 'frameworks'>('basic')
  const [createdEnterpriseId, setCreatedEnterpriseId] = useState<string | null>(null)
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([])
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    enterpriseName: '',
    enterpriseType: 'agency',
    workspaceName: '',
    teamSize: '1-10',
    primaryUseCase: ''
  })

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }))
  }


  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create enterprise
      const { data: enterprise, error: enterpriseError } = await supabase
        .from('enterprises')
        .insert({
          name: onboardingData.enterpriseName,
          type: onboardingData.enterpriseType,
          created_by: user.id,
          team_size: onboardingData.teamSize,
          primary_use_case: onboardingData.primaryUseCase
        })
        .select()
        .single()

      if (enterpriseError) throw enterpriseError

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: onboardingData.workspaceName,
          enterprise_id: enterprise.id,
          created_by: user.id,
          is_default: true
        })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Add user as enterprise member
      const { error: memberError } = await supabase
        .from('enterprise_members')
        .insert({
          enterprise_id: enterprise.id,
          user_id: user.id,
          role: 'admin',
          status: 'active'
        })

      if (memberError) throw memberError

      // Add user as workspace member
      const { error: workspaceMemberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'admin',
          status: 'active'
        })

      if (workspaceMemberError) throw workspaceMemberError

      // Update context
      setCurrentEnterprise(enterprise)
      setCreatedEnterpriseId(enterprise.id)

      // Move to framework selection step
      setStep('frameworks')

    } catch (error: any) {
      console.error('Onboarding error:', error)
      setError(error.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  const handleFrameworkSelection = async () => {
    if (!createdEnterpriseId || selectedFrameworkIds.length === 0) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Save framework selections
      const token = localStorage.getItem('token') || ''
      const response = await fetch(`/api/organizations/${createdEnterpriseId}/frameworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          framework_ids: selectedFrameworkIds
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save framework selections')
      }

      // Navigate to dashboard
      navigate(redirectTo || '/dashboard', { replace: true })
    } catch (error: any) {
      console.error('Framework selection error:', error)
      setError(error.message || 'Failed to save framework selections')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipFrameworks = () => {
    // Allow skipping framework selection
    navigate(redirectTo || '/dashboard', { replace: true })
  }

  if (step === 'frameworks' && createdEnterpriseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <RegulatoryFrameworkSelector
              organizationId={createdEnterpriseId}
              selectedFrameworkIds={selectedFrameworkIds}
              onSelectionChange={setSelectedFrameworkIds}
              onContinue={handleFrameworkSelection}
            />

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={handleSkipFrameworks}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep('basic')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Welcome to AICOMPLYR
          </h1>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
          <label htmlFor="enterpriseName" className="block text-sm font-medium text-gray-700 mb-2">
            Enterprise Name *
          </label>
          <input
            id="enterpriseName"
                type="text"
                value={onboardingData.enterpriseName}
                onChange={(e) => handleInputChange('enterpriseName', e.target.value)}
                placeholder="e.g., Ogilvy Health, Pfizer, Mayo Clinic"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
          <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-2">
            Workspace Name *
          </label>
          <input
            id="workspaceName"
                type="text"
                value={onboardingData.workspaceName}
                onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                placeholder="e.g., Marketing Team, Clinical Operations"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading || !onboardingData.enterpriseName || !onboardingData.workspaceName}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage

