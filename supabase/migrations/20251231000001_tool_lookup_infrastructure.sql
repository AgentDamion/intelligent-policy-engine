-- Tool Lookup Infrastructure Migration
-- Adds fuzzy text search and category inference for unknown tool workflow

-- Enable fuzzy text search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create tool category keywords mapping table
CREATE TABLE IF NOT EXISTS public.tool_category_keywords (
  keyword TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some initial keyword mappings for common AI tools
INSERT INTO public.tool_category_keywords (keyword, category, confidence) VALUES
  ('runway', 'Video Generation', 1.0),
  ('synthesia', 'Video Generation', 1.0),
  ('pika', 'Video Generation', 1.0),
  ('heygen', 'Video Generation', 1.0),
  ('midjourney', 'Image Generation', 1.0),
  ('dall', 'Image Generation', 1.0),
  ('stable diffusion', 'Image Generation', 1.0),
  ('claude', 'Text Generation', 1.0),
  ('gpt', 'Text Generation', 1.0),
  ('bard', 'Text Generation', 1.0),
  ('gemini', 'Text Generation', 1.0),
  ('copilot', 'Code Generation', 1.0),
  ('github', 'Code Generation', 1.0),
  ('eleven', 'Audio Generation', 1.0),
  ('murf', 'Audio Generation', 1.0),
  ('respeecher', 'Audio Generation', 1.0),
  ('jasper', 'Text Generation', 0.9),
  ('copy.ai', 'Text Generation', 0.9),
  ('grammarly', 'Text Generation', 0.8)
ON CONFLICT (keyword) DO NOTHING;

-- Create index for fast keyword lookups
CREATE INDEX IF NOT EXISTS idx_tool_category_keywords_keyword
ON public.tool_category_keywords(keyword);

-- Create function to infer category from tool name
CREATE OR REPLACE FUNCTION infer_tool_category(tool_name TEXT)
RETURNS TABLE(category TEXT, confidence NUMERIC)
LANGUAGE sql
STABLE
AS $$
  SELECT
    tck.category,
    tck.confidence::NUMERIC
  FROM tool_category_keywords tck
  WHERE tool_name ILIKE '%' || tck.keyword || '%'
  ORDER BY tck.confidence DESC
  LIMIT 1;
$$;

-- Create function for fuzzy tool search
CREATE OR REPLACE FUNCTION fuzzy_tool_search(search_term TEXT, enterprise_id UUID DEFAULT NULL)
RETURNS TABLE(
  tool_id UUID,
  tool_name TEXT,
  category TEXT,
  similarity_score NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    atr.id,
    atr.name,
    atr.category,
    GREATEST(
      similarity(atr.name, search_term),
      CASE WHEN search_term ILIKE '%' || split_part(atr.name, ' ', 1) || '%' THEN 0.8 ELSE 0 END
    ) as similarity_score
  FROM ai_tool_registry atr
  WHERE enterprise_id IS NULL OR atr.id IN (
    SELECT DISTINCT tool_id FROM tool_policy_scores WHERE enterprise_id = fuzzy_tool_search.enterprise_id
  )
  AND (
    similarity(atr.name, search_term) > 0.3
    OR atr.name ILIKE '%' || search_term || '%'
    OR search_term ILIKE '%' || split_part(atr.name, ' ', 1) || '%'
  )
  ORDER BY similarity_score DESC, atr.name
  LIMIT 5;
$$;

-- Enable RLS on the keywords table
ALTER TABLE public.tool_category_keywords ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read keywords (they're reference data)
CREATE POLICY "Authenticated users can read tool category keywords"
ON public.tool_category_keywords FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.tool_category_keywords IS 'Maps tool name keywords to categories for unknown tool inference';
COMMENT ON FUNCTION infer_tool_category(TEXT) IS 'Infers tool category from tool name using keyword matching';
COMMENT ON FUNCTION fuzzy_tool_search(TEXT, UUID) IS 'Performs fuzzy search against ai_tool_registry with similarity scoring';
