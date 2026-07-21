import { memo, useState, useEffect } from 'react';
import { Cake, Heart, Sparkles, Users, Edit2, Check, X, Loader2, Plus, Trash2, Baby, RefreshCw, Zap, Star, History, RotateCcw, Brain, MessageSquare, Instagram, Linkedin, Twitter, Phone, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { RapportIntel } from '@/hooks/useRapportIntelView';
import { useRapportIntelMutation } from '@/hooks/useRapportIntelMutation';
import { useAIApprovals } from '@/hooks/useAIApprovals';
import { useFamilyHistory } from '@/hooks/useFamilyHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { logger } from "@/lib/logger";

interface Props {
  rapportIntel: RapportIntel | null;
}

function formatBirthday(date?: string | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  } catch {
    return null;
  }
}

export const DadosPessoaisCard = memo(({ rapportIntel }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [, setFamilyInfo] = useState(rapportIntel?.family_info || '');
  const [spouseName, setSpouseName] = useState('');
  const [children, setChildren] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>(Array.isArray(rapportIntel?.hobbies) ? rapportIntel.hobbies : []);
  const [interests, setInterests] = useState<string[]>(Array.isArray(rapportIntel?.interests) ? rapportIntel.interests : []);
  const [birthday, setBirthday] = useState(rapportIntel?.birthday || '');
  const [anchors, setAnchors] = useState<string[]>(Array.isArray(rapportIntel?.positive_anchors) ? rapportIntel.positive_anchors : []);
  const [newAnchor, setNewAnchor] = useState('');
  const [newChild, setNewChild] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const { suggestions, approve, reject } = useAIApprovals(rapportIntel?.contact_id);
  const { history, revert } = useFamilyHistory(rapportIntel?.contact_id);
  const [showHistory, setShowHistory] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-3 w-3 text-green-500" />;
      case 'call': return <Phone className="h-3 w-3 text-blue-500" />;
      case 'linkedin': return <Linkedin className="h-3 w-3 text-blue-600" />;
      case 'instagram': return <Instagram className="h-3 w-3 text-pink-500" />;
      case 'twitter': return <Twitter className="h-3 w-3 text-sky-400" />;
      case 'other': return <Globe className="h-3 w-3 text-muted-foreground" />;
      default: return <Brain className="h-3 w-3 text-primary" />;
    }
  };

  // Parse family_info if it's JSON or string
  useEffect(() => {
    if (rapportIntel?.family_info) {
      try {
        const parsed = JSON.parse(rapportIntel.family_info);
        setSpouseName(parsed.spouse || '');
        setChildren(parsed.children || []);
      } catch {
        // Fallback for plain string
        setFamilyInfo(rapportIntel.family_info);
      }
    }
  }, [rapportIntel?.family_info]);

  const mutation = useRapportIntelMutation(rapportIntel?.contact_id);

  const handleSave = async () => {
    const updatedFamilyInfo = JSON.stringify({
      spouse: spouseName,
      children: children
    });
    
    await mutation.mutateAsync({
      family_info: updatedFamilyInfo,
      birthday: birthday || null,
      positive_anchors: anchors,
      hobbies: hobbies,
      interests: interests,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (rapportIntel?.family_info) {
      try {
        const parsed = JSON.parse(rapportIntel.family_info);
        setSpouseName(parsed.spouse || '');
        setChildren(parsed.children || []);
      } catch {
        setFamilyInfo(rapportIntel.family_info);
      }
    }
    setBirthday(rapportIntel?.birthday || '');
    setAnchors(Array.isArray(rapportIntel?.positive_anchors) ? rapportIntel.positive_anchors : []);
    setIsEditing(false);
  };

  const handleSocialSync = async () => {
    if (!rapportIntel?.contact_id) return;
    setIsSyncing(true);
    try {
      // Get profile URLs if available
      const { data: contact } = await supabase
        .from('contacts')
        .select('linkedin, twitter, instagram')
        .eq('id', rapportIntel.contact_id)
        .maybeSingle();

      const platforms = [
        { key: 'linkedin', url: contact?.linkedin },
        { key: 'twitter', url: contact?.twitter },
        { key: 'instagram', url: contact?.instagram },
      ].filter(p => p.url);

      if (platforms.length === 0) {
        toast.error('Nenhum link de rede social encontrado para sincronizar.');
        return;
      }

      // Invoke all social scrapers in parallel instead of sequentially
      const results = await Promise.all(
        platforms.map(p => supabase.functions.invoke('social-profile-scraper', {
          body: { contactId: rapportIntel.contact_id, platform: p.key, profileUrl: p.url }
        }))
      );
      const firstError = results.find(r => r.error)?.error;
      if (firstError) throw firstError;

      toast.success('Sincronização social concluída! Recarregando dados...');
      window.location.reload(); // Refresh to show new data
    } catch (error) {
      logger.error('Social sync error:', error);
      toast.error('Erro na sincronização social. Verifique as configurações.');
    } finally {
      setIsSyncing(false);
    }
  };

  const addAnchor = () => {
    if (newAnchor.trim()) {
      setAnchors(prev => [...prev, newAnchor.trim()]);
      setNewAnchor('');
    }
  };

  const removeAnchor = (index: number) => {
    setAnchors(prev => prev.filter((_, i) => i !== index));
  };

  const birthdayFormatted = formatBirthday(rapportIntel?.birthday);
  const family = rapportIntel?.family_info;
  const currentAnchors = Array.isArray(rapportIntel?.positive_anchors) ? rapportIntel.positive_anchors : [];
  const events = Array.isArray(rapportIntel?.upcoming_events) ? rapportIntel.upcoming_events : [];

  const isEmpty = !birthdayFormatted && !family && currentAnchors.length === 0 && events.length === 0 && hobbies.length === 0 && interests.length === 0 && !isEditing;

  return (
    <Card className={cn("transition-all", isEditing && "ring-2 ring-primary/20 shadow-lg")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-primary" />
            Rapport & Dados Pessoais
          </CardTitle>
          <div className="flex items-center gap-1">
            <Popover open={showHistory} onOpenChange={setShowHistory}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Histórico" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <History className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <History className="h-3 w-3" /> Histórico Familiar
                    </h4>
                    <Badge variant="outline" className="text-[10px]">{history.length} versões</Badge>
                  </div>
                  <ScrollArea className="h-[250px] pr-4">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                        <History className="h-8 w-8 mb-2" />
                        <p className="text-xs italic">Nenhum histórico disponível</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map((entry) => (
                          <div key={entry.id} className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs space-y-2 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span className="font-medium">{formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true, locale: ptBR })}</span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 px-2 gap-1 text-[10px] hover:bg-primary hover:text-primary-foreground border-primary/20"
                                onClick={() => {
                                  revert(entry);
                                  setShowHistory(false);
                                }}
                              >
                                <RotateCcw className="h-3 w-3" /> Reverter
                              </Button>
                            </div>
                            <div className="text-foreground line-clamp-3 bg-background/50 p-1.5 rounded border border-border/50 text-[11px]">
                              {entry.family_info || '(Vazio)'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            {!isEditing ? (
              <Button 
                variant="ghost" 
                size="icon" aria-label="Editar" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cancelar"
                  className="h-8 w-8 text-destructive"
                  onClick={handleCancel}
                  disabled={mutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Butt<Button 
                  variant="ghost" 
                  size="icon" aria-label="Carregando" 
                  className="h-8 w-8 text-success"
                  onClick={handleSave}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>           </Button>
              </div>
            )}
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 ml-2 text-xs"
              onClick={handleSocialSync}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Social Sync
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty && !isEditing ? (
          <InlineEmptyState
            icon={Heart}
            title="Sem dados pessoais"
            description="Aniversário, família e âncoras positivas ajudam a personalizar a abordagem."
          />
        ) : (
          <div className="space-y-4">
            {/* Sugestões de IA para Revisão */}
            {suggestions.length > 0 && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Brain className="h-3.5 w-3.5" /> Sugestões IA para Rapport
                </div>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-background rounded border border-border/50 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {getSourceIcon(s.source)}
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">"{s.value}"</p>
                          <div className="flex items-center gap-1">
                            <p className="text-[10px] text-muted-foreground capitalize">{s.type === 'hobby' ? 'Hobby' : 'Interesse'}</p>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              {s.source === 'whatsapp' && <MessageSquare className="h-2 w-2" />}
                              {s.source === 'call' && <Phone className="h-2 w-2" />}
                              {s.source === 'linkedin' && <Linkedin className="h-2 w-2" />}
                              {s.source === 'instagram' && <Instagram className="h-2 w-2" />}
                              {s.source === 'twitter' && <Twitter className="h-2 w-2" />}
                              {s.source === 'other' && <Globe className="h-2 w-2" />}
                              {s.source}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className<Button size="icon" aria-label="Confirmar" variant="ghost" className="h-6 w-6 text-green-500 hover:bg-green-50" onClick={() => approve.mutate(s)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button> w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Rejeitar" className="h-6 w-6 text-destructive hover:bg-red-50" onClick={() => reject.mutate(s.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aniversário */}
            <div className="flex items-start gap-2">
              <Cake className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Aniversário</p>
                {isEditing ? (
                  <Input 
                    type="date" 
                    value={birthday} 
                    onChange={(e) => setBirthday(e.target.value)}
                    className="h-8 mt-1 text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium">{birthdayFormatted || 'Não informado'}</p>
                )}
              </div>
            </div>

            {/* Família */}
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Família (Cônjuge e Filhos)</p>
                {isEditing ? (
                  <div className="space-y-3 mt-1">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Cônjuge</Label>
                      <Input 
                        value={spouseName} 
                        onChange={(e) => setSpouseName(e.target.value)}
                        placeholder="Nome do cônjuge"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Filhos</Label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {children.map((child, i) => (
                          <Badge key={i} variant="secondary" className="text-xs py-0.5 pr-1 gap-1">
                            {child}
                            {/* eslint-disable-next-line sonarjs/no-nested-functions */}
                            <button onClick={() => setChildren(prev => prev.filter((_, idx) => idx !== i))}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Input 
                          value={newChild} 
                          onChange={(e) => setNewChild(e.target.value)}
                          placeholder="Adicionar filho..."
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newChild.trim()) {
                              e.preventDefault();
                              setChildren(prev => [...prev, newChild.trim()]);
                              setNewChild('');
                            }
             <Button 
                          size="icon" aria-label="Adicionar" 
                          variant="outline" 
                          className="h-8 w-8" 
                          onClick={() => {
                            if (newChild.trim()) {
                              setChildren(prev => [...prev, newChild.trim()]);
                              setNewChild('');
                            }
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button> <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 space-y-1">
                    {spouseName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-3 w-3 text-pink-400" />
                        <span>{spouseName}</span>
                      </div>
                    )}
                    {children.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {children.map((child, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal border-blue-100 bg-blue-50 text-blue-600">
                            <Baby className="h-2.5 w-2.5 mr-1" />
                            {child}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {!spouseName && children.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">Não informado</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hobbies */}
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Hobbies</p>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {hobbies.map((hobby, i) => (
                        <Badge key={hobby} variant="secondary" className="text-xs py-0.5 pr-1 gap-1 bg-amber-50 text-amber-700 border-amber-100">
                          {hobby}
                          {/* eslint-disable-next-line sonarjs/no-nested-functions */}
                          <button onClick={() => setHobbies(prev => prev.filter((_, idx) => idx !== i))}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input 
                        value={newHobby} 
                        onChange={(e) => setNewHobby(e.target.value)}
                        placeholder="Novo hobby..."
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newHobby.trim()) {
                            e.preventDefault();
                            setHobbies(prev => [...prev, newHobby.trim()]);
                            setNewHobby('');
            <Button size="icon" aria-label="Adicionar" variant="outline" className="h-8 w-8" onClick={() => { if (newHobby.trim()) { setHobbies(prev => [...prev, newHobby.trim()]); setNewHobby(''); } }}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {hobbies.length > 0 ? (
                      hobbies.map((hobby, i) => {
                        const source = (rapportIntel?.rapport_metadata as { hobbies?: Record<string, string> } | null | undefined)?.hobbies?.[hobby];
                        return (
                          <Badge key={i} variant="secondary" className="text-[10px] font-normal bg-amber-50 text-amber-700 border-amber-100/50 gap-1">
                            {source && getSourceIcon(source)}
                            {hobby}
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Não informado</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interesses */}
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Interesses</p>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((interest, i) => (
                        <Badge key={interest} variant="secondary" className="text-xs py-0.5 pr-1 gap-1 bg-purple-50 text-purple-700 border-purple-100">
                          {interest}
                          {/* eslint-disable-next-line sonarjs/no-nested-functions */}
                          <button onClick={() => setInterests(prev => prev.filter((_, idx) => idx !== i))}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input 
                        value={newInterest} 
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Novo interesse..."
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newInterest.trim()) {
                            e.preventDefault();
                            setInterests(prev => [...prev, newInterest.trim()]);
                            setNewInt<Button size="icon" aria-label="Adicionar" variant="outline" className="h-8 w-8" onClick={() => { if (newInterest.trim()) { setInterests(prev => [...prev, newInterest.trim()]); setNewInterest(''); } }}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>etNewInterest(''); } }}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {interests.length > 0 ? (
                      interests.map((interest, i) => {
                        const source = (rapportIntel?.rapport_metadata as { interests?: Record<string, string> } | null | undefined)?.interests?.[interest];
                        return (
                          <Badge key={i} variant="secondary" className="text-[10px] font-normal bg-purple-50 text-purple-700 border-purple-100/50 gap-1">
                            {source && getSourceIcon(source)}
                            {interest}
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Não informado</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Âncoras */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Âncoras positivas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(isEditing ? anchors : currentAnchors).map((a, i) => (
                  <Badge
                    key={`anchor-${a}-${i}`}
                    variant="secondary" 
                    className={cn("text-xs font-normal", isEditing && "pr-1 gap-1")}
                  >
                    {a}
                    {isEditing && (
                      <button 
                        onClick={() => removeAnchor(i)}
                        className="hover:text-destructive rounded-full p-0.5 transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </Badge>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-1 mt-1 w-full">
                    <Input 
                      placeholder="Nova âncora..." 
                      value={newAnchor}
                      onChange={(e) => setNewAnchor(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter<Button size="icon" aria-label="Adicionar" variant="outline" className="h-7 w-7" onClick={addAnchor}>
                      <Plus className="h-3 w-3" />
                    </Button>iant="outline" className="h-7 w-7" onClick={addAnchor}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!isEditing && currentAnchors.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">Nenhuma registrada</span>
                )}
              </div>
            </div>

            {/* Eventos (Somente Leitura por enquanto conforme plano) */}
            {events.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Próximos eventos (Agenda)</p>
                <ul className="space-y-1">
                  {events.slice(0, 5).map((e, i) => (
                    <li key={`event-${i}`} className="text-sm text-foreground flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
DadosPessoaisCard.displayName = 'DadosPessoaisCard';
