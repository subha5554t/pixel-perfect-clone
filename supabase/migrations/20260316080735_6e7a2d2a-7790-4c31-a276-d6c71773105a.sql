
CREATE TABLE public.impact_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  order_description text NOT NULL,
  products jsonb DEFAULT '[]'::jsonb,
  plastic_saved_kg numeric,
  carbon_avoided_kg numeric,
  local_sourcing_percentage numeric,
  local_artisans_supported integer,
  impact_statement text,
  breakdown jsonb DEFAULT '[]'::jsonb,
  raw_json jsonb
);

ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on impact_reports"
  ON public.impact_reports FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read on impact_reports"
  ON public.impact_reports FOR SELECT TO public
  USING (true);
