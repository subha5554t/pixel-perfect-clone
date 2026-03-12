-- Table for storing AI categorization results
CREATE TABLE public.product_categorizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  primary_category TEXT,
  sub_category TEXT,
  seo_tags TEXT[],
  sustainability_filters TEXT[],
  raw_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing B2B proposal results
CREATE TABLE public.b2b_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_industry TEXT,
  budget_limit NUMERIC,
  requirements TEXT,
  product_mix JSONB,
  budget_allocation JSONB,
  cost_breakdown JSONB,
  impact_summary TEXT,
  raw_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for logging AI prompts and responses
CREATE TABLE public.ai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  model TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public access for demo)
ALTER TABLE public.product_categorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for demo purposes
CREATE POLICY "Allow public read on product_categorizations" ON public.product_categorizations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on product_categorizations" ON public.product_categorizations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on b2b_proposals" ON public.b2b_proposals FOR SELECT USING (true);
CREATE POLICY "Allow public insert on b2b_proposals" ON public.b2b_proposals FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on ai_logs" ON public.ai_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_logs" ON public.ai_logs FOR INSERT WITH CHECK (true);