import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const surveySchema = z.object({
  id: z.string().uuid(),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['pending', 'sent', 'answered', 'expired']),
  channel: z.string().nullable(),
  expires_at: z.string().nullable(),
  survey_type: z.enum(['csat', 'nps', 'ces']),
  rating_min: z.number().int().min(0).max(1),
  rating_max: z.number().int().min(5).max(10),
});
type Survey = z.infer<typeof surveySchema>;

export default function PublicSurvey() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const currentToken = token;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'get_public_csat_survey' as never,
        { _token: currentToken } as never,
      ) as unknown as { data: Survey | null; error: unknown };
      if (cancelled) return;
      const parsed = surveySchema.safeParse(data);
      if (error || !data) {
        setError('Pesquisa não encontrada ou expirada.');
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('Esta pesquisa já expirou.');
      } else if (!parsed.success) {
        setError('Esta pesquisa não possui uma escala de resposta disponível.');
      } else if (parsed.data.status === 'answered') {
        setSurvey(parsed.data);
        setSuccess(true);
      } else {
        setSurvey(parsed.data);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async () => {
    if (score === null || !survey || !token) return;
    if (score < survey.rating_min || score > survey.rating_max || !Number.isInteger(score)) return;
    setSubmitting(true);
    const { data: answered, error } = await supabase.rpc(
      'submit_public_csat_survey' as never,
      { _token: token, _score: score, _feedback: feedback.trim().slice(0, 1000) || null } as never,
    ) as unknown as { data: boolean | null; error: unknown };
    setSubmitting(false);
    if (error || answered !== true) {
      toast.error('Não foi possível registrar sua resposta. Tente novamente.');
      return;
    }
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
            <h2 className="text-lg font-semibold">Pesquisa indisponível</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-success mb-3" />
            <h2 className="text-xl font-semibold">Obrigado!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sua resposta foi registrada com sucesso. Sua opinião é muito valiosa para nós.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Como você avalia sua experiência?</CardTitle>
          <CardDescription>
            {survey?.survey_type === 'nps'
              ? 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar?'
              : survey?.survey_type === 'ces'
                ? 'Em uma escala de 1 a 7, quão fácil foi resolver sua necessidade?'
                : 'Em uma escala de 1 a 5, qual é seu nível de satisfação?'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${survey ? survey.rating_max - survey.rating_min + 1 : 0}, minmax(0, 1fr))` }}>
              {survey && Array.from({ length: survey.rating_max - survey.rating_min + 1 }, (_, index) => {
                const i = index + survey.rating_min;
                const isSelected = score === i;
                const lowThreshold = survey.survey_type === 'nps' ? 6 : 2;
                const midThreshold = survey.survey_type === 'nps' ? 8 : survey.rating_max - 1;
                const colorClass =
                  i <= lowThreshold ? 'border-destructive/40 hover:bg-destructive/10'
                  : i <= midThreshold ? 'border-warning/40 hover:bg-warning/10'
                  : 'border-success/40 hover:bg-success/10';
                const selectedClass =
                  i <= lowThreshold ? 'bg-destructive text-destructive-foreground border-destructive'
                  : i <= midThreshold ? 'bg-warning text-warning-foreground border-warning'
                  : 'bg-success text-success-foreground border-success';
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`Nota ${i}`}
                    onClick={() => setScore(i)}
                    className={`aspect-square rounded-md border-2 text-sm font-semibold transition-all ${
                      isSelected ? selectedClass : colorClass
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 px-0.5">
              <span>{survey?.survey_type === 'nps' ? 'Nada provável' : survey?.survey_type === 'ces' ? 'Muito difícil' : 'Muito insatisfeito'}</span>
              <span>{survey?.survey_type === 'nps' ? 'Muito provável' : survey?.survey_type === 'ces' ? 'Muito fácil' : 'Muito satisfeito'}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Quer compartilhar algo? <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={4}
              maxLength={1000}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={score === null || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              'Enviar resposta'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
