import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useEnterprise } from '../contexts/EnterpriseContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Loader2
} from 'lucide-react'

interface OnboardingData {
  enterpriseName: string
  enterpriseType: 'agency' | 'pharma' | 'healthcare' | 'other'
  workspaceName: string
  teamSize: string
  primaryUseCase: string
}

const OnboardingPage: React.FC = () => {
  const { user } = useAuth()
  const { setCurrentEnterprise } = useEnterprise()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

      // Navigate to dashboard
      navigate('/dashboard')

    } catch (error: any) {
      console.error('Onboarding error:', error)
      setError(error.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  // Basic step components and render logic will be added next...
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
