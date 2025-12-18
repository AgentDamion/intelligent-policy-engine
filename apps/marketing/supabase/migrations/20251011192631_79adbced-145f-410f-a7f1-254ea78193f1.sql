-- Create white_paper_downloads table for lead capture
CREATE TABLE IF NOT EXISTS public.white_paper_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT,
  ai_tools_count TEXT,
  white_paper_id TEXT NOT NULL,
  white_paper_title TEXT NOT NULL,
  newsletter_optin BOOLEAN DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_white_paper_downloads_email ON public.white_paper_downloads(email);
CREATE INDEX IF NOT EXISTS idx_white_paper_downloads_created_at ON public.white_paper_downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_white_paper_downloads_white_paper_id ON public.white_paper_downloads(white_paper_id);

-- Enable RLS
ALTER TABLE public.white_paper_downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public lead capture form)
CREATE POLICY "Anyone can submit white paper downloads"
  ON public.white_paper_downloads
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated admin users can view downloads
CREATE POLICY "Admin users can view white paper downloads"
  ON public.white_paper_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'enterprise'
    )
  );

COMMENT ON TABLE public.white_paper_downloads IS 'Lead capture for white paper downloads from marketing site';