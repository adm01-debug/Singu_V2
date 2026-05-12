-- Create marketing stats table
CREATE TABLE IF NOT EXISTS public.marketing_campaign_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    campaign_id UUID,
    entity_type TEXT NOT NULL, -- 'email', 'form', 'magnet', 'lp'
    entity_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(12,2) DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaign_stats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own marketing stats" ON public.marketing_campaign_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own marketing stats" ON public.marketing_campaign_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own marketing stats" ON public.marketing_campaign_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Create marketing ROI table
CREATE TABLE IF NOT EXISTS public.marketing_roi_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    channel TEXT NOT NULL, -- 'email', 'google_ads', 'facebook_ads', 'organic', etc.
    investment DECIMAL(12,2) NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    leads_generated INTEGER DEFAULT 0,
    customers_acquired INTEGER DEFAULT 0,
    revenue_generated DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_roi_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ROI data" ON public.marketing_roi_data
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ROI data" ON public.marketing_roi_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add ROI fields to email_campaigns if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'investment') THEN
        ALTER TABLE public.email_campaigns ADD COLUMN investment DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'revenue') THEN
        ALTER TABLE public.email_campaigns ADD COLUMN revenue DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- Function to calculate marketing funnel
CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(_user_id UUID, _start_date DATE, _end_date DATE)
RETURNS TABLE (
    stage TEXT,
    count BIGINT,
    previous_stage_count BIGINT,
    conversion_rate DECIMAL
) AS $$
DECLARE
    v_views BIGINT;
    v_leads BIGINT;
    v_mqls BIGINT;
    v_sqls BIGINT;
    v_customers BIGINT;
BEGIN
    -- Total Views (Lead Magnets + Landing Pages)
    SELECT COALESCE(SUM(view_count), 0) INTO v_views
    FROM public.lead_magnets WHERE user_id = _user_id;
    
    -- Total Leads (Submissions)
    SELECT COUNT(*) INTO v_leads
    FROM public.form_submissions s
    JOIN public.marketing_forms f ON s.form_id = f.id
    WHERE f.user_id = _user_id AND s.created_at BETWEEN _start_date AND _end_date;
    
    -- MQLs
    SELECT COUNT(*) INTO v_mqls
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'mql' AND qualified_at BETWEEN _start_date AND _end_date;
    
    -- SQLs
    SELECT COUNT(*) INTO v_sqls
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'sql' AND handoff_at BETWEEN _start_date AND _end_date;
    
    -- Customers
    SELECT COUNT(*) INTO v_customers
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'customer' AND handoff_at BETWEEN _start_date AND _end_date;

    -- Return Views
    stage := 'Visualizações'; count := v_views; previous_stage_count := v_views; conversion_rate := 100;
    RETURN NEXT;
    
    -- Return Leads
    stage := 'Leads'; count := v_leads; previous_stage_count := v_views; 
    conversion_rate := CASE WHEN v_views > 0 THEN (v_leads::DECIMAL / v_views) * 100 ELSE 0 END;
    RETURN NEXT;
    
    -- Return MQLs
    stage := 'MQLs'; count := v_mqls; previous_stage_count := v_leads; 
    conversion_rate := CASE WHEN v_leads > 0 THEN (v_mqls::DECIMAL / v_leads) * 100 ELSE 0 END;
    RETURN NEXT;
    
    -- Return SQLs
    stage := 'SQLs'; count := v_sqls; previous_stage_count := v_mqls; 
    conversion_rate := CASE WHEN v_mqls > 0 THEN (v_sqls::DECIMAL / v_mqls) * 100 ELSE 0 END;
    RETURN NEXT;
    
    -- Return Customers
    stage := 'Clientes'; count := v_customers; previous_stage_count := v_sqls; 
    conversion_rate := CASE WHEN v_sqls > 0 THEN (v_customers::DECIMAL / v_sqls) * 100 ELSE 0 END;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
