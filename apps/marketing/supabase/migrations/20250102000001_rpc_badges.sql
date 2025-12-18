-- RFP/RFI Integration - RPC Functions for Badges and Management
-- This migration adds RPC functions for RFP-specific operations

-- RPC function to get RFP urgency badges with timezone safety
CREATE OR REPLACE FUNCTION rpc_get_rfp_badges(
    p_organization_id UUID,
    p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
    submission_id UUID,
    title TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    urgency_level TEXT,
    days_remaining INTEGER,
    badge_color TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as submission_id,
        s.title,
        s.updated_at as due_date, -- Using updated_at as proxy for due_date
        CASE 
            WHEN s.updated_at < NOW() AT TIME ZONE p_timezone + INTERVAL '7 days' THEN 'critical'
            WHEN s.updated_at < NOW() AT TIME ZONE p_timezone + INTERVAL '14 days' THEN 'urgent'
            WHEN s.updated_at < NOW() AT TIME ZONE p_timezone + INTERVAL '30 days' THEN 'moderate'
            ELSE 'low'
        END as urgency_level,
        EXTRACT(DAY FROM (s.updated_at - NOW() AT TIME ZONE p_timezone))::INTEGER as days_remaining,
        CASE 
            WHEN s.updated_at < NOW() AT TIME ZONE p_timezone + INTERVAL '7 days' THEN 'red'
            WHEN s.updated_at < NOW() AT TIME ZONE p_timezone + INTERVAL '14 days' THEN 'orange'
            WHEN s.updated_at < NOW() AT TIME ZONE p_timezone + INTERVAL '30 days' THEN 'yellow'
            ELSE 'green'
        END as badge_color
    FROM submissions s
    WHERE s.organization_id = p_organization_id
        AND s.submission_type = 'rfp_response'
        AND s.status IN ('draft', 'in_review')
    ORDER BY s.updated_at ASC;
END;
$$;

-- RPC function to bump draft version with conflict detection
CREATE OR REPLACE FUNCTION bump_draft_version(
    p_submission_id UUID,
    p_organization_id UUID,
    p_user_id UUID,
    p_new_content JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_version INTEGER;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
BEGIN
    -- Get current version and updated_at
    SELECT 
        COALESCE((scoring_results->>'version')::INTEGER, 0) as version,
        updated_at
    INTO v_current_version, v_updated_at
    FROM submissions 
    WHERE id = p_submission_id 
        AND organization_id = p_organization_id
    FOR UPDATE;

    -- Check if submission exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Submission not found',
            'code', 'NOT_FOUND'
        );
    END IF;

    -- Check for conflicts (updated in last 5 minutes by different user)
    IF v_updated_at < NOW() - INTERVAL '5 minutes' AND 
       (SELECT created_by FROM submissions WHERE id = p_submission_id) != p_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Potential conflict detected. Please refresh and try again.',
            'code', 'CONFLICT',
            'current_version', v_current_version,
            'last_updated', v_updated_at
        );
    END IF;

    -- Update the submission
    UPDATE submissions 
    SET 
        scoring_results = COALESCE(scoring_results, '{}'::jsonb) || 
                         jsonb_build_object(
                             'version', v_current_version + 1,
                             'last_updated_by', p_user_id,
                             'last_updated_at', NOW(),
                             'content', p_new_content
                         ),
        updated_at = NOW(),
        updated_by = p_user_id
    WHERE id = p_submission_id 
        AND organization_id = p_organization_id;

    -- Return success with new version
    RETURN jsonb_build_object(
        'success', true,
        'new_version', v_current_version + 1,
        'updated_at', NOW()
    );
END;
$$;

-- RPC function to get RFP distributions
CREATE OR REPLACE FUNCTION rpc_get_rfp_distributions(
    p_organization_id UUID,
    p_status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    distribution_id UUID,
    policy_id UUID,
    policy_title TEXT,
    distribution_name TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER,
    response_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id as distribution_id,
        pd.policy_id,
        p.title as policy_title,
        pd.distribution_name,
        pd.status,
        pd.created_at,
        COALESCE(
            (SELECT COUNT(*)::INTEGER 
             FROM policy_distributions pd2 
             WHERE pd2.id = pd.id), 
            0
        ) as recipient_count,
        COALESCE(
            (SELECT COUNT(*)::INTEGER 
             FROM submissions s 
             WHERE s.policy_id = pd.policy_id 
               AND s.submission_type = 'rfp_response'), 
            0
        ) as response_count
    FROM policy_distributions pd
    JOIN policies p ON p.id = pd.policy_id
    WHERE pd.organization_id = p_organization_id
        AND (p_status_filter IS NULL OR pd.status = p_status_filter)
    ORDER BY pd.created_at DESC;
END;
$$;

-- RPC function to get submission progress
CREATE OR REPLACE FUNCTION rpc_get_submission_progress(
    p_organization_id UUID,
    p_submission_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_submissions BIGINT,
    draft_count BIGINT,
    in_review_count BIGINT,
    approved_count BIGINT,
    submitted_count BIGINT,
    rejected_count BIGINT,
    avg_score NUMERIC,
    high_priority_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE s.status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE s.status = 'in_review') as in_review_count,
        COUNT(*) FILTER (WHERE s.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE s.status = 'submitted') as submitted_count,
        COUNT(*) FILTER (WHERE s.status = 'rejected') as rejected_count,
        COALESCE(
            AVG((s.scoring_results->>'percentage')::NUMERIC) FILTER (WHERE s.scoring_results->>'percentage' IS NOT NULL),
            0
        ) as avg_score,
        COUNT(*) FILTER (WHERE s.scoring_results->>'priority' = 'high') as high_priority_count
    FROM submissions s
    WHERE s.organization_id = p_organization_id
        AND (p_submission_type IS NULL OR s.submission_type = p_submission_type);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION rpc_get_rfp_badges(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bump_draft_version(UUID, UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_rfp_distributions(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_submission_progress(UUID, TEXT) TO authenticated;

