import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

const TestComponent = () => {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {user ? `Welcome ${user.email}` : 'Not logged in'}
    </div>
  )
}

describe('AuthContext', () => {
  it('should render loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should handle authentication state changes', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    
    // Mock the auth state change
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument()
    })
  })
})
