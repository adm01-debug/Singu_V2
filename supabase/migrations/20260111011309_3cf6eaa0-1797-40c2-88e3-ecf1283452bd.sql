-- Create favorite_templates table to store user's favorite templates
CREATE TABLE public.favorite_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Enable Row Level Security
ALTER TABLE public.favorite_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites" 
ON public.favorite_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.favorite_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorite_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorite_templates_user_id ON public.favorite_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_templates_template_id ON public.favorite_templates(template_id);