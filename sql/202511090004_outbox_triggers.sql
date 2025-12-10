-- Outbox trigger helpers for event mesh (EPIC B1)

CREATE OR REPLACE FUNCTION public.enqueue_outbox_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_namespace TEXT := COALESCE(TG_ARGV[0], TG_TABLE_NAME);
    status_column   TEXT := NULLIF(COALESCE(TG_ARGV[1], ''), '');
    id_column       TEXT := COALESCE(NULLIF(TG_ARGV[2], ''), 'id');
    enterprise_col  TEXT := COALESCE(NULLIF(TG_ARGV[3], ''), 'enterprise_id');
    entity_uuid     UUID;
    enterprise_uuid UUID;
    status_value    TEXT;
    event_type      TEXT;
    payload         JSONB;
BEGIN
    EXECUTE format('SELECT ($1).%I', id_column) USING NEW INTO entity_uuid;
    EXECUTE format('SELECT ($1).%I', enterprise_col) USING NEW INTO enterprise_uuid;

    IF status_column IS NOT NULL THEN
        EXECUTE format('SELECT ($1).%I::text', status_column) USING NEW INTO status_value;
    END IF;

    event_type := event_namespace;
    IF status_value IS NOT NULL AND status_value <> '' THEN
        event_type := event_namespace || '.' || lower(status_value);
    END IF;

    payload := jsonb_build_object(
        'op', TG_OP,
        'table', TG_TABLE_NAME,
        'new', to_jsonb(NEW),
        'old', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
    );

    INSERT INTO public.outbox (enterprise_id, event_type, entity_type, entity_id, payload)
    VALUES (enterprise_uuid, event_type, TG_TABLE_NAME, entity_uuid, payload);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_policy_change_proposals_outbox ON public.policy_change_proposals;
CREATE TRIGGER trg_policy_change_proposals_outbox
AFTER INSERT ON public.policy_change_proposals
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_outbox_event('pcp', 'status', 'id', 'enterprise_id');

DROP TRIGGER IF EXISTS trg_policy_change_proposals_update_outbox ON public.policy_change_proposals;
CREATE TRIGGER trg_policy_change_proposals_update_outbox
AFTER UPDATE OF status ON public.policy_change_proposals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.enqueue_outbox_event('pcp', 'status', 'id', 'enterprise_id');

DROP TRIGGER IF EXISTS trg_variances_outbox ON public.variances;
CREATE TRIGGER trg_variances_outbox
AFTER INSERT OR UPDATE OF status ON public.variances
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_outbox_event('variance', 'status', 'id', 'enterprise_id');

DROP TRIGGER IF EXISTS trg_tool_approvals_outbox ON public.tool_approvals;
CREATE TRIGGER trg_tool_approvals_outbox
AFTER INSERT OR UPDATE OF status ON public.tool_approvals
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_outbox_event('tool.approval', 'status', 'id', 'enterprise_id');

DROP TRIGGER IF EXISTS trg_proof_events_outbox ON public.proof_events;
CREATE TRIGGER trg_proof_events_outbox
AFTER INSERT ON public.proof_events
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_outbox_event('proof', 'event_type', 'id', 'enterprise_id');

