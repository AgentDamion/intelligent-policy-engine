-- Fix search_path on recalc_risk_score function
CREATE OR REPLACE FUNCTION recalc_risk_score(p_workflow UUID)
RETURNS VOID LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_pre INT; v_in INT; v_post INT; v_total INT; v_band risk_band_t;
  w_pre NUMERIC; w_in NUMERIC; w_post NUMERIC;
  v_vendor_mult NUMERIC; v_reg_mult NUMERIC;
BEGIN
  SELECT 
    w_pre, w_in, w_post, 
    vendor_security_multiplier, 
    regulatory_compliance_multiplier
  INTO w_pre, w_in, w_post, v_vendor_mult, v_reg_mult
  FROM risk_weights;
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN pc.control_key LIKE '%vendor_security%' THEN (pc.points * pc.weight * v_vendor_mult)::INT
      WHEN pc.control_key LIKE '%regulatory%' THEN (pc.points * pc.weight * v_reg_mult)::INT
      ELSE (pc.points * pc.weight)::INT
    END
  ), 0)
  INTO v_pre
  FROM policy_controls pc
  WHERE pc.workflow_id = p_workflow AND pc.stage = 'pre_run';
  
  v_pre := LEAST(v_pre, 100);
  
  SELECT COALESCE(SUM(ee.delta_points), 0)
  INTO v_in
  FROM evidence_events ee
  WHERE ee.workflow_id = p_workflow AND ee.stage = 'in_run';
  
  v_in := GREATEST(LEAST(v_in, 50), -50);
  
  SELECT COALESCE(SUM(po.points), 0)
  INTO v_post
  FROM postrun_outcomes po
  WHERE po.workflow_id = p_workflow;
  
  v_post := LEAST(v_post, 100);
  
  v_total := ROUND(w_pre * v_pre + w_in * v_in + w_post * v_post);
  v_total := GREATEST(LEAST(v_total, 100), 0);
  
  v_band := CASE
    WHEN v_total >= 75 THEN 'low'::risk_band_t
    WHEN v_total >= 50 THEN 'medium'::risk_band_t
    ELSE 'high'::risk_band_t
  END;
  
  INSERT INTO risk_scores (workflow_id, pre_run, in_run, post_run, total, band, last_calculated_at, updated_at)
  VALUES (p_workflow, v_pre, v_in, v_post, v_total, v_band, NOW(), NOW())
  ON CONFLICT (workflow_id) DO UPDATE
    SET pre_run = EXCLUDED.pre_run,
        in_run = EXCLUDED.in_run,
        post_run = EXCLUDED.post_run,
        total = EXCLUDED.total,
        band = EXCLUDED.band,
        last_calculated_at = NOW(),
        updated_at = NOW();
END $$;