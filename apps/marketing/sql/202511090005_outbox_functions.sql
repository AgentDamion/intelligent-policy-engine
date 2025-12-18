-- Stored procedures supporting outbox publisher (EPIC B2)

CREATE OR REPLACE FUNCTION public.dequeue_outbox_batch(
    p_limit INTEGER DEFAULT 50,
    p_lock_timeout_seconds INTEGER DEFAULT 60
)
RETURNS SETOF public.outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH candidates AS (
        SELECT id
        FROM public.outbox
        WHERE published_at IS NULL
          AND scheduled_at <= NOW()
          AND (
            locked_at IS NULL
            OR locked_at < NOW() - make_interval(secs => p_lock_timeout_seconds)
          )
        ORDER BY scheduled_at, id
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.outbox o
       SET locked_at = NOW(),
           locked_by = COALESCE(current_setting('request.jwt.claims', true), current_user)
     WHERE o.id IN (SELECT id FROM candidates)
     RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_outbox_event(
    p_id BIGINT,
    p_success BOOLEAN,
    p_error TEXT DEFAULT NULL,
    p_retry_seconds INTEGER DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.outbox;
BEGIN
    SELECT * INTO v_row FROM public.outbox WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF p_success THEN
        UPDATE public.outbox
           SET attempts = v_row.attempts + 1,
               published_at = NOW(),
               last_error = NULL,
               locked_at = NULL,
               locked_by = NULL
         WHERE id = p_id;
    ELSE
        UPDATE public.outbox
           SET attempts = v_row.attempts + 1,
               last_error = p_error,
               locked_at = NULL,
               locked_by = NULL,
               scheduled_at = CASE
                                WHEN v_row.attempts + 1 >= v_row.max_attempts THEN scheduled_at
                                ELSE NOW() + make_interval(secs => p_retry_seconds)
                              END
         WHERE id = p_id;

        IF v_row.attempts + 1 >= v_row.max_attempts THEN
            INSERT INTO public.dead_letter (outbox_id, enterprise_id, event_type, payload, error_message, failed_at, last_attempt_at, attempts)
            VALUES (v_row.id, v_row.enterprise_id, v_row.event_type, v_row.payload, COALESCE(p_error, 'max_attempts_exceeded'), NOW(), NOW(), v_row.attempts + 1);

            DELETE FROM public.outbox WHERE id = p_id;
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_realtime_event(
    p_channel TEXT,
    p_event TEXT,
    p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_message JSONB;
BEGIN
    v_message := jsonb_build_object(
        'type', 'broadcast',
        'event', p_event,
        'payload', p_payload
    );
    PERFORM pg_notify('realtime:public:' || p_channel, v_message::TEXT);
END;
$$;

