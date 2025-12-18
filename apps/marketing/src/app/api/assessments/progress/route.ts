
import { supabase } from '@/integrations/supabase/client';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, current_step, answers, evidence, organization_data } = data;

    // Generate secure token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_assessment_token');

    if (tokenError) {
      throw new Error('Failed to generate token');
    }

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save progress to database
    const { data: progressData, error } = await supabase
      .from('assessment_progress')
      .insert({
        token: tokenData,
        email,
        current_step,
        answers,
        evidence,
        organization_data,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving progress:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save progress' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    }

    // TODO: Send email with resume link
    // In production, implement email sending with the token

    return new Response(JSON.stringify({
      success: true,
      token: tokenData,
      resumeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/ai-acceleration-score?resume=${tokenData}`
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in progress save:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}