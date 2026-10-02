// ==============================================
// PAIN-CLAIM-GAIN BUILDER - SalesBrain Framework
// Build persuasive messaging using neuroscience
// ==============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { PainPoint, ClaimStatement, GainProof } from '@/types/neuromarketing';
import { toast } from 'sonner';

interface PainClaimGainBuilderProps {
  contactId: string;
  contactName: string;
  onGenerate?: (script: string) => void;
}

const PainClaimGainBuilder = ({
  contactId,
  contactName,
  onGenerate
}: PainClaimGainBuilderProps) => {
  const [activeTab, setActiveTab] = useState<'pain' | 'claim' | 'gain'>('pain');

  // Pain State
  const [pains, setPains] = useState<PainPoint[]>([]);
  const [newPain, setNewPain] = useState('');
  const [newPainIntensity, setNewPainIntensity] = useState(7);

  // Claim State
  const [claims, setClaims] = useState<ClaimStatement[]>([]);
  const [newClaim, setNewClaim] = useState('');
  const [newClaimProof, setNewClaimProof] = useState('');

  // Gain State
  const [gains, setGains] = useState<GainProof[]>([]);
  const [newGain, setNewGain] = useState('');
  const [newGainType, setNewGainType] = useState<'financial' | 'strategic' | 'personal'>('financial');

  // Add pain
  const addPain = () => {
    if (!newPain.trim()) return;

    setPains(prev => [...prev, {
      id: `pain-${Date.now()}`,
      description: newPain,
      intensity: newPainIntensity,
      frequency: 'weekly',
      emotionalImpact: newPainIntensity >= 8 ? 'Alto impacto' : 'Impacto moderado',
      detected: false
    }]);
    setNewPain('');
    setNewPainIntensity(7);
  };

  // Add claim
  const addClaim = () => {
    if (!newClaim.trim()) return;

    setClaims(prev => [...prev, {
      id: `claim-${Date.now()}`,
      claim: newClaim,
      uniqueness: 7,
      credibility: 8,
      memorability: 7,
      proofPoints: newClaimProof ? [newClaimProof] : []
    }]);
    setNewClaim('');
    setNewClaimProof('');
  };

  // Add gain
  const addGain = () => {
    if (!newGain.trim()) return;

    setGains(prev => [...prev, {
      id: `gain-${Date.now()}`,
      gainType: newGainType,
      description: newGain,
      quantified: newGain.match(/\d/) !== null
    }]);
    setNewGain('');
  };

  // Calculate alignment score
  const alignmentScore = useMemo(() => {
    const painScore = Math.min(40, pains.length * 15);
    const claimScore = Math.min(30, claims.length * 15);
    const gainScore = Math.min(30, gains.length * 15);
    return painScore + claimScore + gainScore;
  }, [pains, claims, gains]);

  // Generate script
  const generateScript = () => {
    if (pains.length === 0 || claims.length === 0 || gains.length === 0) {
      toast.error('Complete as 3 etapas para gerar o script');
      return;
    }

    const dominantPain = pains.sort((a, b) => b.intensity - a.intensity)[0];

    const script = `
🎯 SCRIPT NEURO-OTIMIZADO PARA ${contactName.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 ABERTURA (Ativando o Cérebro Reptiliano)
"${contactName.split(' ')[0]}, imagino que você também enfrenta ${dominantPain.description}..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💢 APROFUNDANDO A DOR (Pain)
${pains.map((p, i) => `
${i + 1}. "${p.description}"
   → Intensidade: ${'🔥'.repeat(Math.ceil(p.intensity / 2))}
   → Pergunta: "Como isso está impactando você/sua equipe/seus resultados?"
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 DIFERENCIAL ÚNICO (Claim)
${claims.map((c, i) => `
${i + 1}. "${c.claim}"
   → Prova: ${c.proofPoints[0] || 'Adicione evidências'}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 GANHOS TANGÍVEIS (Gain)
${gains.map((g, i) => `
${i + 1}. [${g.gainType.toUpperCase()}] ${g.description}
   → ${g.quantified ? '✅ Quantificado' : '⚠️ Adicione números!'}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ CALL-TO-ACTION (Fechamento com Contraste)
"${contactName.split(' ')[0]}, você pode continuar [repetir a dor principal]...
OU pode [ganho principal] em [timeframe].

O que faz mais sentido para você?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    navigator.clipboard.writeText(script)
      .then(() => { toast.success('Script copiado para a área de transferência!'); onGenerate?.(script); })
      .catch(() => toast.error('Não foi possível copiar'));
  };

  const getGainIcon = (type: string) => {
    switch (type) {
      case 'financial': return '💰';
      case 'strategic': return '🎯';
      case 'personal': return '❤️';
      default: return '✨';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pain → Claim → Gain Builder
          </CardTitle>
          <Badge variant={alignmentScore >= 80 ? 'default' : 'secondary'}>
            {alignmentScore}% Completo
          </Badge>
        </div>
        <Progress value={alignmentScore} className="h-2" />
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pain' | 'claim' | 'gain')}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pain" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Dor</span>
              <Badge variant="outline" className="ml-1 text-xs">{pains.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="claim" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Claim</span>
              <Badge variant="outline" className="ml-1 text-xs">{claims.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="gain" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Ganho</span>
              <Badge variant="outline" className="ml-1 text-xs">{gains.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* PAIN TAB */}
          <TabsContent value="pain" className="space-y-4">
            <div className="p-3 bg-destructive dark:bg-destructive/20 rounded-lg border border-destructive dark:border-destructive">
              <h4 className="font-medium text-destructive dark:text-destructive text-sm mb-1">
                💢 Identifique as DORES do cliente
              </h4>
              <p className="text-xs text-destructive dark:text-destructive">
                O cérebro reptiliano é motivado a EVITAR dor. Quanto mais específica e intensa, melhor.
              </p>
            </div>

            {/* Pain List */}
            <div className="space-y-2">
              {pains.map((pain, i) => (
                <div key={pain.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-lg">{'🔥'.repeat(Math.ceil(pain.intensity / 3))}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pain.description}</p>
                    <p className="text-xs text-muted-foreground">Intensidade: {pain.intensity}/10</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"

                    onClick={() => setPains(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Pain Form */}
            <div className="space-y-3 p-3 border rounded-lg">
              <Textarea
                placeholder="Descreva uma dor específica do cliente..."
                value={newPain}
                onChange={(e) => setNewPain(e.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Intensidade:</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newPainIntensity}
                  onChange={(e) => setNewPainIntensity(Number(e.target.value))}
                  className="flex-1"
                  aria-label="Intensidade da dor (1-10)"
                />
                <Badge variant="outline">{newPainIntensity}/10</Badge>
              </div>
              <Button onClick={addPain} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Dor
              </Button>
            </div>

            {/* Pain Tips */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Dicas para identificar dores
              </h5>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• "O que mais te frustra sobre [situação atual]?"</li>
                <li>• "Quanto tempo/dinheiro você perde com [problema]?"</li>
                <li>• "O que acontece se isso continuar assim?"</li>
              </ul>
            </div>
          </TabsContent>

          {/* CLAIM TAB */}
          <TabsContent value="claim" className="space-y-4">
            <div className="p-3 bg-info dark:bg-info/20 rounded-lg border border-info dark:border-info">
              <h4 className="font-medium text-info dark:text-info text-sm mb-1">
                🏆 Defina seu DIFERENCIAL ÚNICO
              </h4>
              <p className="text-xs text-info dark:text-info">
                O que SÓ VOCÊ oferece? Por que escolher você e não o concorrente?
              </p>
            </div>

            {/* Claims List */}
            <div className="space-y-2">
              {claims.map((claim, i) => (
                <div key={claim.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Award className="h-5 w-5 text-info" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{claim.claim}</p>
                    {claim.proofPoints[0] && (
                      <p className="text-xs text-muted-foreground">Prova: {claim.proofPoints[0]}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"

                    onClick={() => setClaims(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Claim Form */}
            <div className="space-y-3 p-3 border rounded-lg">
              <Input
                placeholder="Seu diferencial único..."
                value={newClaim}
                onChange={(e) => setNewClaim(e.target.value)}
              />
              <Input
                placeholder="Prova/Evidência (case, número, certificação...)"
                value={newClaimProof}
                onChange={(e) => setNewClaimProof(e.target.value)}
              />
              <Button onClick={addClaim} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Claim
              </Button>
            </div>
          </TabsContent>

          {/* GAIN TAB */}
          <TabsContent value="gain" className="space-y-4">
            <div className="p-3 bg-success dark:bg-success/20 rounded-lg border border-success dark:border-success">
              <h4 className="font-medium text-success dark:text-success text-sm mb-1">
                💰 Quantifique os GANHOS
              </h4>
              <p className="text-xs text-success dark:text-success">
                Ganhos tangíveis e específicos. Números concretos convencem o cérebro primitivo.
              </p>
            </div>

            {/* Gains List */}
            <div className="space-y-2">
              {gains.map((gain, i) => (
                <div key={gain.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xl">{getGainIcon(gain.gainType)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{gain.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{gain.gainType}</Badge>
                      {gain.quantified && <Badge variant="secondary" className="text-xs">Quantificado ✓</Badge>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"

                    onClick={() => setGains(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Gain Form */}
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="flex gap-2">
                {(['financial', 'strategic', 'personal'] as const).map(type => (
                  <Button
                    key={type}
                    variant={newGainType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewGainType(type)}
                  >
                    {getGainIcon(type)} {type === 'financial' ? 'Financeiro' : type === 'strategic' ? 'Estratégico' : 'Pessoal'}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Descreva o ganho com números específicos... Ex: 'Economia de R$ 15.000/mês'"
                value={newGain}
                onChange={(e) => setNewGain(e.target.value)}
                rows={2}
              />
              <Button onClick={addGain} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Ganho
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <div className="mt-6 pt-4 border-t">
          <Button
            onClick={generateScript}
            className="w-full"
            disabled={alignmentScore < 50}
          >
            <Copy className="h-4 w-4 mr-2" />
            Gerar Script Neuro-Otimizado
          </Button>
          {alignmentScore < 50 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Complete pelo menos 50% para gerar o script
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PainClaimGainBuilder;
