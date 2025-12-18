import { supabase } from '@/integrations/supabase/client';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Fetch progress data
    const { data: progressData, error } = await supabase
      .from('assessment_progress')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('completed_at', null)
      .single();

    if (error || !progressData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(progressData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error loading progress:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}