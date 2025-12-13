import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import OnboardingPage from '../OnboardingPage'
import { supabase } from '../../lib/supabase'

// Mock the contexts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}))

vi.mock('../../contexts/EnterpriseContext', () => ({
  useEnterprise: () => ({
    setCurrentEnterprise: vi.fn()
  })
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-enterprise-id', name: 'Test Enterprise' },
            error: null
          }))
        }))
      }))
    }))
  }
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the onboarding form', () => {
    renderWithRouter(<OnboardingPage />)
    
    expect(screen.getByText('Welcome to AICOMPLYR')).toBeInTheDocument()
    expect(screen.getByLabelText('Enterprise Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Workspace Name *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates required fields', () => {
    renderWithRouter(<OnboardingPage />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when required fields are filled', () => {
    renderWithRouter(<OnboardingPage />)
    
    const enterpriseInput = screen.getByLabelText('Enterprise Name *')
    const workspaceInput = screen.getByLabelText('Workspace Name *')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(enterpriseInput, { target: { value: 'Test Enterprise' } })
    fireEvent.change(workspaceInput, { target: { value: 'Test Workspace' } })
    
    expect(submitButton).not.toBeDisabled()
  })

  it('submits the form successfully', async () => {
    renderWithRouter(<OnboardingPage />)
    
    const enterpriseInput = screen.getByLabelText('Enterprise Name *')
    const workspaceInput = screen.getByLabelText('Workspace Name *')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(enterpriseInput, { target: { value: 'Test Enterprise' } })
    fireEvent.change(workspaceInput, { target: { value: 'Test Workspace' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('enterprises')
    })
  })

  it('handles form submission errors', async () => {
    // Mock Supabase to return an error
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }))
    } as any)

    renderWithRouter(<OnboardingPage />)
    
    const enterpriseInput = screen.getByLabelText('Enterprise Name *')
    const workspaceInput = screen.getByLabelText('Workspace Name *')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(enterpriseInput, { target: { value: 'Test Enterprise' } })
    fireEvent.change(workspaceInput, { target: { value: 'Test Workspace' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })
  })
})
