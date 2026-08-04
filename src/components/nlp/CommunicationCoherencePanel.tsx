// ==============================================
// Communication Coherence Panel - Alignment Analysis
// Ensures communication matches all behavioral profiles
// Enterprise Level Component
// ==============================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XCircle, AlertTriangle, Target, Eye, Ear, Hand, Brain, Zap, Copy, Check, Lightbulb, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Contact, DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS, VAK_PREDICATES, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { METAPROGRAM_LABELS, METAPROGRAM_KEYWORDS } from '@/types/metaprograms';
import { POWER_WORDS } from '@/data/nlpAdvancedData';
import { getDominantVAK, getDISCProfile, getMetaprogramProfile } from '@/lib/contact-utils';

interface CommunicationCoherencePanelProps {
  contact: Contact;
  className?: string;
}

interface CoherenceIssue {
  type: 'vak' | 'disc' | 'metaprogram';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  word?: string;
  suggestion?: string;
}

interface CoherenceAnalysis {
  overallScore: number;
  vakScore: number;
  discScore: number;
  metaprogramScore: number;
  issues: CoherenceIssue[];
  strengths: string[];
  optimizedMessage: string;
}

const CommunicationCoherencePanel: React.FC<CommunicationCoherencePanelProps> = ({
  contact,
  className
}) => {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<CoherenceAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  // Get profiles
  const vakType = getDominantVAK(contact) as VAKType || 'V';
  const discProfile = (getDISCProfile(contact) as DISCProfile) || 'D';
  const metaProfile = getMetaprogramProfile(contact);
  const motivationDirection = metaProfile?.motivationDirection || 'toward';
  const referenceFrame = metaProfile?.referenceFrame || 'balanced';

  // Analyze message coherence
  const analyzeMessage = () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem para analisar');
      return;
    }

    const lowerMessage = message.toLowerCase();
    const issues: CoherenceIssue[] = [];
    const strengths: string[] = [];
    let optimized = message;

    // 1. VAK Analysis
    let vakMatches = 0;
    let wrongVakMatches = 0;
    const vakWords = VAK_PREDICATES[vakType] || [];
    const wrongVakTypes = (['V', 'A', 'K', 'D'] as VAKType[]).filter(t => t !== vakType);

    vakWords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) vakMatches++;
    });

    wrongVakTypes.forEach(wrongType => {
      VAK_PREDICATES[wrongType].slice(0, 15).forEach(word => {
        if (lowerMessage.includes(word.toLowerCase())) {
          wrongVakMatches++;
          // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
          const replacement = vakWords[Math.floor(Math.random() * Math.min(5, vakWords.length))];
          issues.push({
            type: 'vak',
            severity: 'warning',
            message: `"${word}" é ${wrongType === 'V' ? 'Visual' : wrongType === 'A' ? 'Auditivo' : wrongType === 'K' ? 'Cinestésico' : 'Digital'}`,
            word,
            suggestion: `Use "${replacement}" em vez de "${word}"`
          });
          const regex = new RegExp(word, 'gi');
          optimized = optimized.replace(regex, replacement);
        }
      });
    });

    const vakScore = Math.max(0, Math.min(100, 50 + vakMatches * 15 - wrongVakMatches * 20));
    if (vakMatches > 0) {
      strengths.push(`✓ Usa ${vakMatches} predicado(s) ${VAK_LABELS[vakType].name}`);
    }
    if (vakMatches === 0) {
      issues.push({
        type: 'vak',
        severity: 'error',
        message: `Faltam predicados ${VAK_LABELS[vakType].name}`,
        suggestion: `Adicione: ${VAK_COMMUNICATION_TIPS[vakType].useWords.slice(0, 3).join(', ')}`
      });
    }

    // 2. DISC Analysis
    let discMatches = 0;
    const discWords = POWER_WORDS.disc[discProfile] || [];
    
    discWords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) discMatches++;
    });

    const discScore = Math.min(100, 50 + discMatches * 20);
    if (discMatches > 0) {
      strengths.push(`✓ Alinhado com perfil ${discProfile} (${discMatches} palavras)`);
    }
    if (discMatches === 0) {
      issues.push({
        type: 'disc',
        severity: 'suggestion',
        message: `Adicione palavras do perfil ${DISC_LABELS[discProfile].name}`,
        suggestion: `Inclua: ${discWords.slice(0, 4).join(', ')}`
      });
    }

    // 3. Metaprogram Analysis
    let metaMatches = 0;
    let wrongMetaMatches = 0;
    const metaKeywords = METAPROGRAM_KEYWORDS[motivationDirection === 'toward' ? 'toward' : 'awayFrom'];
    const wrongMetaKeywords = METAPROGRAM_KEYWORDS[motivationDirection === 'toward' ? 'awayFrom' : 'toward'];

    metaKeywords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) metaMatches++;
    });

    wrongMetaKeywords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) {
        wrongMetaMatches++;
        // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
        const replacement = metaKeywords[Math.floor(Math.random() * Math.min(5, metaKeywords.length))];
        issues.push({
          type: 'metaprogram',
          severity: 'warning',
          message: `"${word}" é ${motivationDirection === 'toward' ? 'Afastar-se De' : 'Em Direção A'}`,
          word,
          suggestion: `Use "${replacement}" em vez de "${word}"`
        });
        const regex = new RegExp(word, 'gi');
        optimized = optimized.replace(regex, replacement);
      }
    });

    const metaprogramScore = Math.max(0, Math.min(100, 50 + metaMatches * 15 - wrongMetaMatches * 20));
    if (metaMatches > 0) {
      strengths.push(`✓ Motivação ${motivationDirection === 'toward' ? 'positiva (ganhos)' : 'preventiva (evitar)'}`);
    }

    // Check reference frame
    if (referenceFrame === 'external') {
      const externalWords = ['outros', 'clientes', 'mercado', 'especialistas', 'pesquisa'];
      const hasExternal = externalWords.some(w => lowerMessage.includes(w));
      if (!hasExternal) {
        issues.push({
          type: 'metaprogram',
          severity: 'suggestion',
          message: 'Cliente tem referência externa',
          suggestion: 'Adicione provas sociais, cases ou dados de mercado'
        });
      }
    }

    // Add name if missing
    if (!message.includes(contact.firstName)) {
      optimized = `${contact.firstName}, ${optimized.charAt(0).toLowerCase() + optimized.slice(1)}`;
      issues.push({
        type: 'disc',
        severity: 'suggestion',
        message: 'Falta personalização',
        suggestion: `Use o nome "${contact.firstName}" para personalizar`
      });
    }

    // Calculate overall score
    const overallScore = Math.round((vakScore * 0.4 + discScore * 0.3 + metaprogramScore * 0.3));

    setAnalysis({
      overallScore,
      vakScore,
      discScore,
      metaprogramScore,
      issues,
      strengths,
      optimizedMessage: optimized
    });

    toast.success('Análise concluída!');
  };

  const copyOptimized = () => {
    if (analysis?.optimizedMessage) {
      navigator.clipboard.writeText(analysis.optimizedMessage)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Mensagem copiada!'); })
        .catch(() => toast.error('Não foi possível copiar'));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success dark:bg-success';
    if (score >= 60) return 'bg-warning dark:bg-warning';
    return 'bg-destructive dark:bg-destructive';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Coerência Comunicacional
            </CardTitle>
            <CardDescription>
              Verifique se sua mensagem está alinhada com o perfil de {contact.firstName}
            </CardDescription>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={cn(VAK_LABELS[vakType]?.bgColor)}>
            {vakType === 'V' && <Eye className="w-3 h-3 mr-1" />}
            {vakType === 'A' && <Ear className="w-3 h-3 mr-1" />}
            {vakType === 'K' && <Hand className="w-3 h-3 mr-1" />}
            {vakType === 'D' && <Brain className="w-3 h-3 mr-1" />}
            {VAK_LABELS[vakType]?.name}
          </Badge>
          <Badge variant="outline">{discProfile}</Badge>
          <Badge variant="outline">
            {METAPROGRAM_LABELS.motivationDirection[motivationDirection]?.icon}{' '}
            {METAPROGRAM_LABELS.motivationDirection[motivationDirection]?.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            placeholder={`Digite uma mensagem para ${contact.firstName}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button onClick={analyzeMessage} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            Analisar Coerência
          </Button>
        </div>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Score Overview */}
              <div className={cn('p-4 rounded-lg', getScoreBg(analysis.overallScore))}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Score de Coerência</span>
                  <span className={cn('text-2xl font-bold', getScoreColor(analysis.overallScore))}>
                    {analysis.overallScore}%
                  </span>
                </div>
                <Progress value={analysis.overallScore} className="h-2 mb-3" />
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className={cn('font-semibold', getScoreColor(analysis.vakScore))}>
                      {analysis.vakScore}%
                    </div>
                    <div className="text-muted-foreground text-xs">VAK</div>
                  </div>
                  <div className="text-center">
                    <div className={cn('font-semibold', getScoreColor(analysis.discScore))}>
                      {analysis.discScore}%
                    </div>
                    <div className="text-muted-foreground text-xs">DISC</div>
                  </div>
                  <div className="text-center">
                    <div className={cn('font-semibold', getScoreColor(analysis.metaprogramScore))}>
                      {analysis.metaprogramScore}%
                    </div>
                    <div className="text-muted-foreground text-xs">Meta</div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-success dark:bg-success border border-success dark:border-success">
                  <h4 className="text-sm font-medium text-success dark:text-success mb-2">
                    Pontos Fortes
                  </h4>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-success dark:text-success">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Issues */}
              {analysis.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Ajustes Recomendados</h4>
                  <ScrollArea className="h-40">
                    {analysis.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-2 rounded-lg mb-2 border text-sm',
                          issue.severity === 'error' && 'bg-destructive dark:bg-destructive border-destructive',
                          issue.severity === 'warning' && 'bg-warning dark:bg-warning border-warning/30',
                          issue.severity === 'suggestion' && 'bg-info dark:bg-info border-info'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {issue.severity === 'error' && <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                          {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />}
                          {issue.severity === 'suggestion' && <Lightbulb className="w-4 h-4 text-info shrink-0 mt-0.5" />}
                          <div>
                            <p className="font-medium">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-muted-foreground text-xs mt-1">{issue.suggestion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Optimized Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Versão Otimizada
                  </h4>
                  <Button variant="outline" size="sm" onClick={copyOptimized} className="gap-1">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                  <p className="text-sm">{analysis.optimizedMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default CommunicationCoherencePanel;
