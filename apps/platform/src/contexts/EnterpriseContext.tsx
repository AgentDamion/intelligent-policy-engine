import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Enterprise = Database['public']['Tables']['enterprises']['Row']
type Workspace = Database['public']['Tables']['workspaces']['Row']
type EnterpriseMember = Database['public']['Tables']['enterprise_members']['Row']
type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']

interface EnterpriseContextType {
  currentEnterprise: Enterprise | null
  workspaces: Workspace[]
  enterpriseMembers: EnterpriseMember[]
  workspaceMembers: WorkspaceMember[]
  loading: boolean
  enterpriseFetchComplete: boolean
  createEnterprise: (name: string) => Promise<{ data: Enterprise | null; error: any }>
  createWorkspace: (name: string, enterpriseId: string, enterpriseName: string) => Promise<{ data: Workspace | null; error: any }>
  addEnterpriseMember: (enterpriseId: string, userId: string, role: 'owner' | 'admin' | 'editor' | 'viewer') => Promise<{ error: any }>
  addWorkspaceMember: (workspaceId: string, userId: string, role: 'owner' | 'admin' | 'editor' | 'viewer') => Promise<{ error: any }>
  setCurrentEnterprise: (enterprise: Enterprise | null) => void
  refreshData: () => Promise<void>
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined)

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext)
  if (context === undefined) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider')
  }
  return context
}

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [enterpriseMembers, setEnterpriseMembers] = useState<EnterpriseMember[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [enterpriseFetchComplete, setEnterpriseFetchComplete] = useState(false)
  const [fetchInProgress, setFetchInProgress] = useState(false)
  const [hasNoEnterprise, setHasNoEnterprise] = useState(false)

  const fetchUserEnterprises = async () => {
    if (!user) {
      setEnterpriseFetchComplete(true)
      setLoading(false)
      setHasNoEnterprise(true)
      return
    }

    try {
      setFetchInProgress(true)
      setHasNoEnterprise(false)
      // Get enterprises where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('enterprise_members')
        .select('enterprise_id, role')
        .eq('user_id', user.id)

      if (membershipError) throw membershipError

      if (memberships && memberships.length > 0) {
        // Get enterprise details
        const enterpriseIds = memberships.map(m => m.enterprise_id)
        const { data: enterprises, error: enterpriseError } = await supabase
          .from('enterprises')
          .select('*')
          .in('id', enterpriseIds)

        if (enterpriseError) throw enterpriseError

        // Set first enterprise as current if none selected
        if (enterprises && enterprises.length > 0) {
          setCurrentEnterprise(enterprises[0])
          setHasNoEnterprise(false)
        } else {
          setHasNoEnterprise(true)
        }
      } else {
        setHasNoEnterprise(true)
      }
    } catch (error) {
      console.error('Error fetching user enterprises:', error)
      setHasNoEnterprise(true)
    } finally {
      setFetchInProgress(false)
      setLoading(false)
    }
  }

  const fetchWorkspaces = async () => {
    if (!currentEnterprise) return

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('enterprise_id', currentEnterprise.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkspaces(data || [])
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    }
  }

  const fetchEnterpriseMembers = async () => {
    if (!currentEnterprise) return

    try {
      const { data, error } = await supabase
        .from('enterprise_members')
        .select('*')
        .eq('enterprise_id', currentEnterprise.id)

      if (error) throw error
      setEnterpriseMembers(data || [])
    } catch (error) {
      console.error('Error fetching enterprise members:', error)
    }
  }

  const fetchWorkspaceMembers = async () => {
    if (!currentEnterprise) return

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .in('workspace_id', workspaces.map(w => w.id))

      if (error) throw error
      setWorkspaceMembers(data || [])
    } catch (error) {
      console.error('Error fetching workspace members:', error)
    }
  }

  const refreshData = async () => {
    await Promise.all([
      fetchUserEnterprises(),
      fetchWorkspaces(),
      fetchEnterpriseMembers(),
      fetchWorkspaceMembers(),
    ])
  }

  useEffect(() => {
    if (user) {
      setEnterpriseFetchComplete(false)
      setLoading(true)
      setHasNoEnterprise(false)
      fetchUserEnterprises()
    } else {
      setEnterpriseFetchComplete(true)
      setLoading(false)
      setHasNoEnterprise(true)
    }
  }, [user])

  // Set enterpriseFetchComplete to true only after React has applied the state update
  // This ensures ProtectedRoute waits for the enterprise to be set before redirecting
  useEffect(() => {
    if (!fetchInProgress) {
      // Fetch is complete - check if we have an enterprise or confirmed there's none
      if (currentEnterprise || hasNoEnterprise) {
        if (!enterpriseFetchComplete) {
          setEnterpriseFetchComplete(true)
        }
      }
    }
  }, [currentEnterprise, hasNoEnterprise, fetchInProgress, enterpriseFetchComplete])

  useEffect(() => {
    if (currentEnterprise) {
      fetchWorkspaces()
      fetchEnterpriseMembers()
    }
  }, [currentEnterprise])

  useEffect(() => {
    if (workspaces.length > 0) {
      fetchWorkspaceMembers()
    }
  }, [workspaces])

  const createEnterprise = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('enterprises')
        .insert([{ name }])
        .select()
        .single()

      if (error) throw error

      // Add user as owner
      if (data && user) {
        await supabase
          .from('enterprise_members')
          .insert([{
            enterprise_id: data.id,
            user_id: user.id,
            role: 'owner'
          }])
      }

      await refreshData()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const createWorkspace = async (name: string, enterpriseId: string, enterpriseName: string) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{
          name,
          enterprise_id: enterpriseId,
          enterprise_name: enterpriseName
        }])
        .select()
        .single()

      if (error) throw error

      // Add user as owner
      if (data && user) {
        await supabase
          .from('workspace_members')
          .insert([{
            workspace_id: data.id,
            user_id: user.id,
            role: 'owner'
          }])
      }

      await refreshData()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const addEnterpriseMember = async (enterpriseId: string, userId: string, role: 'owner' | 'admin' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('enterprise_members')
        .insert([{
          enterprise_id: enterpriseId,
          user_id: userId,
          role
        }])

      if (error) throw error
      await refreshData()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const addWorkspaceMember = async (workspaceId: string, userId: string, role: 'owner' | 'admin' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: workspaceId,
          user_id: userId,
          role
        }])

      if (error) throw error
      await refreshData()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    currentEnterprise,
    workspaces,
    enterpriseMembers,
    workspaceMembers,
    loading,
    enterpriseFetchComplete,
    createEnterprise,
    createWorkspace,
    addEnterpriseMember,
    addWorkspaceMember,
    setCurrentEnterprise,
    refreshData,
  }

  return <EnterpriseContext.Provider value={value}>{children}</EnterpriseContext.Provider>
}
