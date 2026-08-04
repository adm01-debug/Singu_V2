-- Table for tracking AI recommendation history
CREATE TABLE IF NOT EXISTS public.ai_recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL, -- Reference to external contact ID
    recommendation_score FLOAT NOT NULL,
    recommendation_reasons JSONB NOT NULL, -- Array of objective reasons
    input_data_snapshot JSONB NOT NULL, -- Snapshot of data used for recommendation
    user_action TEXT, -- e.g., 'accepted', 'dismissed', 'ignored'
    action_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for AI-generated follow-up approvals
CREATE TABLE IF NOT EXISTS public.follow_up_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL,
    channel TEXT NOT NULL, -- 'whatsapp', 'email'
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'sent'
    scheduled_for TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_recommendation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_approvals ENABLE ROW LEVEL SECURITY;

-- Policies for recommendation logs
CREATE POLICY "Users can view their own recommendation logs"
    ON public.ai_recommendation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendation logs"
    ON public.ai_recommendation_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendation logs"
    ON public.ai_recommendation_logs FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for follow-up approvals
CREATE POLICY "Users can manage their follow-up approvals"
    ON public.follow_up_approvals FOR ALL
    USING (auth.uid() = user_id);

-- Trigger for updated_at on approvals
CREATE TRIGGER update_follow_up_approvals_updated_at
BEFORE UPDATE ON public.follow_up_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();