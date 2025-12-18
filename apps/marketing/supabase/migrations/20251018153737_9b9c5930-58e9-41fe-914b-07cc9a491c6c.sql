-- ============================================================================
-- Phase 2: Policy Inheritance Logic (Array Operators Fixed)
-- ============================================================================

-- 1. Create enum
CREATE TYPE policy_inheritance_mode AS ENUM ('replace', 'merge', 'append');

-- 2. Extend policies table
ALTER TABLE policies 
  ADD COLUMN scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  ADD COLUMN parent_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  ADD COLUMN inheritance_mode policy_inheritance_mode DEFAULT 'merge',
  ADD COLUMN override_rules JSONB DEFAULT '{}',
  ADD COLUMN is_inherited BOOLEAN DEFAULT false;

CREATE INDEX idx_policies_scope_id ON policies(scope_id);
CREATE INDEX idx_policies_parent_policy_id ON policies(parent_policy_id);

-- 3. Policy conflicts table
CREATE TABLE policy_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  parent_policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('stricter', 'looser', 'incompatible')),
  field_path TEXT NOT NULL,
  parent_value JSONB,
  child_value JSONB,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_policy_conflicts_child ON policy_conflicts(child_policy_id);
CREATE INDEX idx_policy_conflicts_parent ON policy_conflicts(parent_policy_id);
CREATE INDEX idx_policy_conflicts_unresolved ON policy_conflicts(resolved) WHERE NOT resolved;

ALTER TABLE policy_conflicts ENABLE ROW LEVEL SECURITY;

-- RLS for conflicts
CREATE POLICY "Users can view policy conflicts"
ON policy_conflicts FOR SELECT
USING (
  child_policy_id IN (
    SELECT p.id FROM policies p
    WHERE (
      p.enterprise_id = ANY (get_user_enterprises(auth.uid()))
      OR (p.scope_id IS NOT NULL AND p.scope_id IN (
        SELECT scope_id FROM user_roles
        WHERE user_id = auth.uid() AND role >= 'viewer'::app_role
      ))
    )
  )
);

CREATE POLICY "Admins can resolve conflicts"
ON policy_conflicts FOR UPDATE
USING (
  child_policy_id IN (
    SELECT p.id FROM policies p
    WHERE (
      p.enterprise_id = ANY (get_user_enterprises(auth.uid()))
      OR (p.scope_id IS NOT NULL AND p.scope_id IN (
        SELECT scope_id FROM user_roles
        WHERE user_id = auth.uid() AND role >= 'admin'::app_role
      ))
    )
  )
);

-- 4. Merge functions
CREATE OR REPLACE FUNCTION merge_policy_rules(
  parent_rules JSONB,
  child_rules JSONB,
  mode policy_inheritance_mode
) RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  CASE mode
    WHEN 'replace' THEN RETURN child_rules;
    WHEN 'merge' THEN RETURN parent_rules || child_rules;
    WHEN 'append' THEN RETURN jsonb_deep_merge(parent_rules, child_rules);
    ELSE RETURN child_rules;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION jsonb_deep_merge(parent JSONB, child JSONB)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result JSONB := parent;
  key TEXT;
  value JSONB;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each(child) LOOP
    IF jsonb_typeof(value) = 'object' AND result ? key AND jsonb_typeof(result->key) = 'object' THEN
      result := jsonb_set(result, ARRAY[key], jsonb_deep_merge(result->key, value));
    ELSIF jsonb_typeof(value) = 'array' AND result ? key AND jsonb_typeof(result->key) = 'array' THEN
      result := jsonb_set(result, ARRAY[key], (result->key) || value);
    ELSE
      result := jsonb_set(result, ARRAY[key], value);
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- 5. Get effective policy
CREATE OR REPLACE FUNCTION get_effective_policy(
  p_scope_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_scope_path ltree;
  accumulated_rules JSONB := '{}';
  policy_rec RECORD;
BEGIN
  SELECT scope_path INTO target_scope_path FROM scopes WHERE id = p_scope_id;
  
  IF target_scope_path IS NULL THEN
    RAISE EXCEPTION 'Scope not found: %', p_scope_id;
  END IF;
  
  FOR policy_rec IN
    SELECT p.id, p.title, p.rules, p.override_rules, p.inheritance_mode
    FROM policies p
    JOIN scopes s ON s.id = p.scope_id
    WHERE target_scope_path ~ (s.scope_path::text || '.*')::lquery
    ORDER BY nlevel(s.scope_path) ASC
  LOOP
    accumulated_rules := merge_policy_rules(
      accumulated_rules,
      COALESCE(policy_rec.override_rules, policy_rec.rules),
      policy_rec.inheritance_mode
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'effective_rules', accumulated_rules,
    'scope_id', p_scope_id,
    'computed_at', NOW()
  );
END;
$$;

-- 6. Conflict detection
CREATE OR REPLACE FUNCTION detect_policy_conflicts(p_child_policy_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  child_rec RECORD;
  parent_rec RECORD;
  conflict_key TEXT;
BEGIN
  SELECT p.*, s.scope_path
  INTO child_rec
  FROM policies p
  JOIN scopes s ON s.id = p.scope_id
  WHERE p.id = p_child_policy_id;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  FOR parent_rec IN
    SELECT p.id, p.title, p.rules
    FROM policies p
    JOIN scopes s ON s.id = p.scope_id
    WHERE child_rec.scope_path ~ (s.scope_path::text || '.*')::lquery
      AND s.scope_path != child_rec.scope_path
      AND nlevel(s.scope_path) < nlevel(child_rec.scope_path)
    ORDER BY nlevel(s.scope_path) DESC
  LOOP
    FOR conflict_key IN SELECT DISTINCT jsonb_object_keys(parent_rec.rules) LOOP
      IF (parent_rec.rules->conflict_key)::text ~ '^\d+$' 
         AND (child_rec.rules->conflict_key)::text ~ '^\d+$' THEN
        
        IF (parent_rec.rules->>conflict_key)::numeric > (child_rec.rules->>conflict_key)::numeric THEN
          INSERT INTO policy_conflicts (child_policy_id, parent_policy_id, conflict_type, field_path, parent_value, child_value, severity)
          VALUES (p_child_policy_id, parent_rec.id, 'looser', conflict_key, parent_rec.rules->conflict_key, child_rec.rules->conflict_key, 'warning')
          ON CONFLICT DO NOTHING;
        ELSIF (parent_rec.rules->>conflict_key)::numeric < (child_rec.rules->>conflict_key)::numeric THEN
          INSERT INTO policy_conflicts (child_policy_id, parent_policy_id, conflict_type, field_path, parent_value, child_value, severity)
          VALUES (p_child_policy_id, parent_rec.id, 'stricter', conflict_key, parent_rec.rules->conflict_key, child_rec.rules->conflict_key, 'info')
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 7. Inheritance tree view
CREATE OR REPLACE VIEW policy_inheritance_tree AS
SELECT 
  p.id, p.title, p.scope_id,
  s.scope_path, s.scope_name,
  p.parent_policy_id, pp.title as parent_policy_title,
  p.inheritance_mode, p.is_inherited,
  COALESCE(nlevel(s.scope_path), 0) as hierarchy_level,
  (SELECT COUNT(*) FROM policy_conflicts pc WHERE pc.child_policy_id = p.id AND NOT pc.resolved) as unresolved_conflicts,
  p.created_at, p.updated_at
FROM policies p
LEFT JOIN scopes s ON s.id = p.scope_id
LEFT JOIN policies pp ON pp.id = p.parent_policy_id
ORDER BY s.scope_path NULLS FIRST, p.created_at;

-- 8. Trigger
CREATE OR REPLACE FUNCTION trigger_detect_policy_conflicts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM detect_policy_conflicts(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_policy_change_detect_conflicts
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  WHEN (NEW.scope_id IS NOT NULL)
  EXECUTE FUNCTION trigger_detect_policy_conflicts();

-- 9. Update policies RLS
DROP POLICY IF EXISTS "Users can view policies in their enterprise" ON policies;
DROP POLICY IF EXISTS "Users can create policies in their enterprise" ON policies;
DROP POLICY IF EXISTS "Users can update policies in their enterprise" ON policies;

CREATE POLICY "Users can view policies in hierarchy"
ON policies FOR SELECT
USING (
  enterprise_id = ANY (get_user_enterprises(auth.uid()))
  OR (scope_id IS NOT NULL AND scope_id IN (
    SELECT scope_id FROM user_roles
    WHERE user_id = auth.uid() AND role >= 'viewer'::app_role
  ))
);

CREATE POLICY "Admins can create policies in scope"
ON policies FOR INSERT
WITH CHECK (
  enterprise_id = ANY (get_user_enterprises(auth.uid()))
  OR (scope_id IS NOT NULL AND scope_id IN (
    SELECT scope_id FROM user_roles
    WHERE user_id = auth.uid() AND role >= 'admin'::app_role
  ))
);

CREATE POLICY "Admins can update policies in scope"
ON policies FOR UPDATE
USING (
  enterprise_id = ANY (get_user_enterprises(auth.uid()))
  OR (scope_id IS NOT NULL AND scope_id IN (
    SELECT scope_id FROM user_roles
    WHERE user_id = auth.uid() AND role >= 'admin'::app_role
  ))
);

-- 10. Comments
COMMENT ON COLUMN policies.scope_id IS 'Links policy to a hierarchical scope for inheritance';
COMMENT ON COLUMN policies.parent_policy_id IS 'Direct parent policy for explicit inheritance chains';
COMMENT ON COLUMN policies.inheritance_mode IS 'How child policies inherit rules: replace, merge, or append';
COMMENT ON COLUMN policies.override_rules IS 'Specific rules that override inherited values';
COMMENT ON COLUMN policies.is_inherited IS 'True if this policy was auto-created from a parent scope';
COMMENT ON FUNCTION get_effective_policy IS 'Computes the final policy for a scope by walking up the inheritance tree';
COMMENT ON FUNCTION detect_policy_conflicts IS 'Analyzes a policy against its parents to detect rule conflicts';
COMMENT ON TABLE policy_conflicts IS 'Tracks detected conflicts between child and parent policies';