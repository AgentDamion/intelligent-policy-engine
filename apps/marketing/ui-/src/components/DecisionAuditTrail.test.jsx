import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DecisionAuditTrail from './DecisionAuditTrail';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the audit API data
const mockAuditData = {
  success: true,
  auditTrail: [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'john.doe@company.com',
      action: 'Policy Decision Approved',
      decisionType: 'policy',
      status: 'approved',
      rationale: 'Content complies with FDA social media guidelines.',
      policyReferences: ['FDA-SM-001', 'SOCIAL-MEDIA-POLICY'],
      details: {
        confidence_score: 0.95,
        compliance_score: 0.98,
        risk_level: 'low',
        processing_time_ms: 1200
      }
    },
    {
      id: '2',
      timestamp: '2024-01-15T09:15:00Z',
      user: 'sarah.smith@company.com',
      action: 'Risk Assessment Completed',
      decisionType: 'risk',
      status: 'review',
      rationale: 'Potential compliance risk identified.',
      policyReferences: ['RISK-ASSESSMENT-001'],
      details: {
        confidence_score: 0.78,
        compliance_score: 0.85,
        risk_level: 'medium',
        processing_time_ms: 2100
      }
    }
  ]
};

describe('DecisionAuditTrail', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    expect(screen.getByText('Loading audit trail...')).toBeInTheDocument();
  });

  it('renders audit entries after loading', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Policy Decision Approved')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment Completed')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading audit trail')).toBeInTheDocument();
    });
  });

  it('toggles filter panel when filter button is clicked', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Policy Decision Approved')).toBeInTheDocument();
    });

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('expands entry when clicked', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Policy Decision Approved')).toBeInTheDocument();
    });

    const entry = screen.getByText('Policy Decision Approved').closest('div');
    fireEvent.click(entry);
    
    await waitFor(() => {
      expect(screen.getByText('Decision Rationale')).toBeInTheDocument();
      expect(screen.getByText('Policy References')).toBeInTheDocument();
    });
  });

  it('filters entries by search query', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Policy Decision Approved')).toBeInTheDocument();
    });

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search entries...');
    fireEvent.change(searchInput, { target: { value: 'Risk Assessment' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Policy Decision Approved')).not.toBeInTheDocument();
      expect(screen.getByText('Risk Assessment Completed')).toBeInTheDocument();
    });
  });

  it('displays statistics correctly', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total entries
      expect(screen.getByText('1')).toBeInTheDocument(); // Approved count
      expect(screen.getByText('1')).toBeInTheDocument(); // Review count
    });
  });

  it('calls API with correct organization ID', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditData)
      })
    );

    render(<DecisionAuditTrail organizationId="test-org-123" />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/dashboard/audit-trail/test-org-123',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-ID': 'test-org-123'
          }
        })
      );
    });
  });
}); 