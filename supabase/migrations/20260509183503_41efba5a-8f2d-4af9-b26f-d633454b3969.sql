-- Create personality frameworks table
CREATE TABLE public.contact_personality (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    
    -- Big Five
    big_five_openness INTEGER CHECK (big_five_openness >= 0 AND big_five_openness <= 100),
    big_five_conscientiousness INTEGER CHECK (big_five_conscientiousness >= 0 AND big_five_conscientiousness <= 100),
    big_five_extraversion INTEGER CHECK (big_five_extraversion >= 0 AND big_five_extraversion <= 100),
    big_five_agreeableness INTEGER CHECK (big_five_agreeableness >= 0 AND big_five_agreeableness <= 100),
    big_five_neuroticism INTEGER CHECK (big_five_neuroticism >= 0 AND big_five_neuroticism <= 100),
    big_five_confidence INTEGER CHECK (big_five_confidence >= 0 AND big_five_confidence <= 100),
    
    -- MBTI
    mbti_type TEXT CHECK (mbti_type ~ '^[E|I][S|N][T|F][J|P]$'),
    mbti_e_i_score INTEGER CHECK (mbti_e_i_score >= 0 AND mbti_e_i_score <= 100),
    mbti_s_n_score INTEGER CHECK (mbti_s_n_score >= 0 AND mbti_s_n_score <= 100),
    mbti_t_f_score INTEGER CHECK (mbti_t_f_score >= 0 AND mbti_t_f_score <= 100),
    mbti_j_p_score INTEGER CHECK (mbti_j_p_score >= 0 AND mbti_j_p_score <= 100),
    
    -- Enneagram
    enneagram_type INTEGER CHECK (enneagram_type >= 1 AND enneagram_type <= 9),
    enneagram_wing INTEGER CHECK (enneagram_wing >= 1 AND enneagram_wing <= 9),
    enneagram_scores JSONB, -- Store detailed scores per type
    
    -- Temperament
    temperament_primary TEXT,
    temperament_secondary TEXT,
    temperament_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_personality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users on personality" ON public.contact_personality FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Register for audit
CREATE TRIGGER log_contact_personality_change AFTER UPDATE ON public.contact_personality FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();

-- Update updated_at trigger
CREATE TRIGGER update_contact_personality_updated_at BEFORE UPDATE ON public.contact_personality FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
