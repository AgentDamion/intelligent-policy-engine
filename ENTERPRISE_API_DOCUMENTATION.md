# Enterprise API Documentation

## Overview
This document outlines all API endpoints available for enterprise pharma operations. All endpoints support organization-scoped access and include proper error handling, pagination, and data validation.

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints require proper authentication. The server uses Supabase service role key for backend operations.

## Response Format
All successful responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 1. Change Management System

### GET /api/change-requests
Retrieve change requests with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `status`: Filter by status
- `request_type`: Filter by request type
- `impact_level`: Filter by impact level
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "AI Governance Policy Update",
      "request_type": "policy",
      "impact_level": "high",
      "status": "submitted",
      "requester": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "organization": {
        "id": "uuid",
        "name": "Pharma Corp"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### POST /api/change-requests
Create a new change request.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "request_type": "policy",
  "title": "AI Governance Policy Update",
  "description": "Update policy for FDA compliance",
  "impact_level": "high",
  "requester_id": "uuid"
}
```

### PUT /api/change-requests/:id
Update an existing change request.

## 2. Incident & Crisis Management

### GET /api/incidents
Retrieve incidents with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `status`: Filter by status
- `severity`: Filter by severity
- `priority`: Filter by priority
- `incident_type`: Filter by incident type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "incident_number": "INC-2024-001",
      "title": "Data Classification Policy Violation",
      "incident_type": "compliance",
      "severity": "medium",
      "priority": "high",
      "status": "open",
      "reported_by": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/incidents
Create a new incident.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "incident_number": "INC-2024-001",
  "incident_type": "compliance",
  "severity": "medium",
  "priority": "high",
  "title": "Data Classification Policy Violation",
  "description": "User attempted to access restricted data",
  "reported_by": "uuid"
}
```

### PUT /api/incidents/:id
Update an existing incident.

## 3. Quality Management System (QMS)

### GET /api/sop-documents
Retrieve SOP documents with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `status`: Filter by status
- `document_type`: Filter by document type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "document_number": "SOP-AI-001",
      "title": "AI Tool Approval and Validation Procedure",
      "document_type": "sop",
      "version": "1.0",
      "status": "approved",
      "approver": {
        "id": "uuid",
        "email": "approver@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "effective_date": "2024-01-01",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/sop-documents
Create a new SOP document.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "document_number": "SOP-AI-001",
  "title": "AI Tool Approval and Validation Procedure",
  "document_type": "sop",
  "version": "1.0",
  "content": "Document content here",
  "approver_id": "uuid"
}
```

### PUT /api/sop-documents/:id
Update an existing SOP document.

## 4. Vendor Risk Management

### GET /api/vendors
Retrieve vendors with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `risk_level`: Filter by risk level
- `compliance_status`: Filter by compliance status
- `vendor_type`: Filter by vendor type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vendor_name": "CloudTech Solutions Inc.",
      "vendor_type": "cloud",
      "risk_level": "medium",
      "compliance_status": "compliant",
      "data_access_level": "limited",
      "last_assessment_date": "2024-01-01",
      "next_assessment_date": "2024-07-01",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/vendors
Create a new vendor.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "vendor_name": "CloudTech Solutions Inc.",
  "vendor_type": "cloud",
  "risk_level": "medium",
  "compliance_status": "pending",
  "data_access_level": "limited"
}
```

### PUT /api/vendors/:id
Update an existing vendor.

## 5. Disaster Recovery & Business Continuity

### GET /api/disaster-recovery-plans
Retrieve DR plans with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `plan_type`: Filter by plan type
- `status`: Filter by status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "plan_name": "AI Platform Disaster Recovery Plan",
      "plan_type": "dr",
      "critical_functions": ["AI Model Serving", "Data Processing"],
      "recovery_time_objective_hours": 4,
      "recovery_point_objective_hours": 1,
      "status": "active",
      "last_tested_date": "2024-01-01",
      "next_test_date": "2024-07-01",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/disaster-recovery-plans
Create a new DR plan.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "plan_name": "AI Platform Disaster Recovery Plan",
  "plan_type": "dr",
  "critical_functions": ["AI Model Serving", "Data Processing"],
  "recovery_time_objective_hours": 4,
  "recovery_point_objective_hours": 1
}
```

### PUT /api/disaster-recovery-plans/:id
Update an existing DR plan.

## 6. Enterprise Onboarding & Access Management

### GET /api/enterprise-onboarding
Retrieve onboarding records with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `status`: Filter by status
- `onboarding_type`: Filter by onboarding type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "onboarding_type": "new_hire",
      "status": "in_progress",
      "required_training_completed": true,
      "background_check_completed": true,
      "start_date": "2024-01-01",
      "target_completion_date": "2024-01-15",
      "user": {
        "id": "uuid",
        "email": "newhire@example.com",
        "first_name": "New",
        "last_name": "Hire"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/enterprise-onboarding
Create a new onboarding record.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "user_id": "uuid",
  "onboarding_type": "new_hire",
  "start_date": "2024-01-01",
  "target_completion_date": "2024-01-15"
}
```

### PUT /api/enterprise-onboarding/:id
Update an existing onboarding record.

## 7. Global Compliance Tracking

### GET /api/compliance-requirements
Retrieve compliance requirements with filtering and pagination.

**Query Parameters:**
- `organization_id` (required): Organization UUID
- `jurisdiction`: Filter by jurisdiction
- `regulation_type`: Filter by regulation type
- `status`: Filter by status
- `risk_level`: Filter by risk level
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "regulation_name": "FDA 21 CFR Part 11 - Electronic Records",
      "jurisdiction": "US",
      "regulation_type": "fda",
      "effective_date": "2024-01-01",
      "compliance_deadline": "2024-12-31",
      "status": "in_progress",
      "risk_level": "high",
      "responsible_party": {
        "id": "uuid",
        "email": "compliance@example.com",
        "first_name": "Compliance",
        "last_name": "Officer"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/compliance-requirements
Create a new compliance requirement.

**Request Body:**
```json
{
  "organization_id": "uuid",
  "regulation_name": "FDA 21 CFR Part 11 - Electronic Records",
  "jurisdiction": "US",
  "regulation_type": "fda",
  "effective_date": "2024-01-01",
  "compliance_deadline": "2024-12-31",
  "risk_level": "high",
  "responsible_party": "uuid"
}
```

### PUT /api/compliance-requirements/:id
Update an existing compliance requirement.

## Enterprise Dashboard

### GET /api/enterprise/dashboard
Get comprehensive dashboard summary for an organization.

**Query Parameters:**
- `organization_id` (required): Organization UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "counts": {
      "changeRequests": 15,
      "incidents": 8,
      "sopDocuments": 25,
      "vendors": 12,
      "drPlans": 5,
      "onboarding": 3,
      "compliance": 18
    },
    "criticalItems": {
      "changeRequests": [
        {
          "id": "uuid",
          "title": "Critical Policy Update",
          "impact_level": "critical",
          "status": "submitted"
        }
      ],
      "incidents": [
        {
          "id": "uuid",
          "title": "High Priority Incident",
          "priority": "urgent",
          "status": "open"
        }
      ],
      "complianceDeadlines": [
        {
          "id": "uuid",
          "regulation_name": "FDA Compliance",
          "compliance_deadline": "2024-03-01",
          "risk_level": "high"
        }
      ]
    }
  }
}
```

## Utility Endpoints

### GET /api/enterprise/options
Get all available options for dropdowns and filters.

**Response:**
```json
{
  "success": true,
  "data": {
    "changeRequestTypes": ["policy", "contract", "system", "process", "procedure"],
    "impactLevels": ["low", "medium", "high", "critical"],
    "incidentTypes": ["security", "performance", "compliance", "data", "system", "process", "quality"],
    "jurisdictions": ["US", "EU", "UK", "Canada", "Australia", "Japan", "China", "India", "Brazil", "Global"],
    "regulationTypes": ["fda", "ema", "hipaa", "gdpr", "ccpa", "sox", "gxp", "iso"]
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (missing required parameters)
- `404`: Not Found
- `500`: Internal Server Error

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (starts from 1)
- `limit`: Items per page (default: 20, max: 100)

## Filtering

Most endpoints support filtering by relevant fields. Use query parameters to filter results:
- Single value: `?status=open`
- Multiple values: `?impact_level=high&status=submitted`

## Data Relationships

All endpoints return related data where applicable:
- User information (names, emails)
- Organization details
- Related contract information
- Approval and review details

## Security Features

- Organization-scoped access control
- Row Level Security (RLS) policies
- Input validation and sanitization
- Proper error handling without data leakage
- CORS configuration for frontend integration
