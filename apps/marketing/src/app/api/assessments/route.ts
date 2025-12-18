/**
 * Assessment Processing API
 * Handles creating, scoring, and persisting AI readiness assessments
 */
// NextRequest not available in this setup
import { assessmentScoring } from '@/services/assessment-scoring';
import type { AssessmentAnswer } from '@/services/assessment-scoring';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

function rateLimit(ip: string, limit: number = 3, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip).filter((time: number) => time > windowStart);
  
  if (requests.length >= limit) {
    return false;
  }
  
  requests.push(now);
  rateLimitStore.set(ip, requests);
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate limiting (simplified for demo)
    const ip = 'demo-ip';
    if (!rateLimit(ip)) {
      return Response.json(
        { error: 'Too many requests. Please wait before submitting another assessment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { 
      answers, 
      organizationType, 
      organizationSize, 
      ownerEmail,
      honeypot // Security honeypot field
    } = body;

    // Security: Check honeypot
    if (honeypot) {
      return Response.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!answers || !Array.isArray(answers)) {
      return Response.json(
        { error: 'Answers array is required' },
        { status: 400 }
      );
    }

    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      return Response.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Process assessment
    const result = assessmentScoring.calculateScore(
      answers as AssessmentAnswer[],
      organizationType,
      organizationSize
    );

    // In production, you would:
    // 1. Save assessment to database
    // 2. Send verification email to ownerEmail
    // 3. Generate and store PDF report
    // 4. Return assessment ID for later retrieval

    const assessmentData = {
      id: result.assessmentId,
      ownerEmail,
      organizationType,
      organizationSize,
      result,
      createdAt: new Date().toISOString(),
      verified: false, // Would be set to true after email verification
      scoreVersion: 'v1.0.0'
    };

    return Response.json({
      success: true,
      data: {
        assessmentId: result.assessmentId,
        composite: result.composite,
        band: result.band,
        confidence: result.confidence,
        projectedTTA: result.projectedTTA,
        domainBreakdown: result.domainBreakdown,
        mustPassResults: result.mustPassGates,
        recommendations: result.recommendations,
        scoreVersion: 'v1.0.0',
        pdfUrl: `/api/assessments/${result.assessmentId}/pdf`,
        createdAt: assessmentData.createdAt
      },
      message: 'Assessment completed successfully. Check your email for verification.'
    });

  } catch (error) {
    console.error('Assessment API error:', error);
    
    return Response.json(
      { 
        error: 'Failed to process assessment', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get assessment by ID or email verification token
    const url = new URL(request.url);
    const assessmentId = url.searchParams.get('id');
    const token = url.searchParams.get('token');

    if (!assessmentId && !token) {
      return Response.json(
        { error: 'Assessment ID or verification token required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // For now, return mock data
    const assessmentData = {
      id: assessmentId || 'mock-id',
      verified: !!token,
      result: {
        composite: 78,
        band: 'enabled',
        confidence: 0.86,
        projectedTTA: 45,
        scoreVersion: 'v1.0.0'
      },
      createdAt: new Date().toISOString()
    };

    return Response.json({
      success: true,
      data: assessmentData
    });

  } catch (error) {
    return Response.json(
      { error: 'Failed to retrieve assessment' },
      { status: 500 }
    );
  }
}