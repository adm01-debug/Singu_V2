import { memo, useState, useEffect, useCallback } from 'react';
import { Cake, Heart, Sparkles, Users, Edit2, Check, X, Loader2, Plus, Trash2, Baby, RefreshCw, Zap, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RapportIntel } from '@/hooks/useRapportIntelView';
import { useRapportIntelMutation } from '@/hooks/useRapportIntelMutation';
import { cn } from '@/lib/utils';

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
  const [familyInfo, setFamilyInfo] = useState(rapportIntel?.family_info || '');
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
        .single();

      const platforms = [
        { key: 'linkedin', url: contact?.linkedin },
        { key: 'twitter', url: contact?.twitter },
        { key: 'instagram', url: contact?.instagram },
      ].filter(p => p.url);

      if (platforms.length === 0) {
        toast.error('Nenhum link de rede social encontrado para sincronizar.');
        return;
      }

      for (const p of platforms) {
        const { error } = await supabase.functions.invoke('social-profile-scraper', {
          body: {
            contactId: rapportIntel.contact_id,
            platform: p.key,
            profileUrl: p.url
          }
        });
        if (error) throw error;
      }

      toast.success('Sincronização social concluída! Recarregando dados...');
      window.location.reload(); // Refresh to show new data
    } catch (error) {
      console.error('Social sync error:', error);
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

  const isEmpty = !birthdayFormatted && !family && currentAnchors.length === 0 && events.length === 0 && !isEditing;

  return (
    <Card className={cn("transition-all", isEditing && "ring-2 ring-primary/20 shadow-lg")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-primary" />
            Rapport & Dados Pessoais
          </CardTitle>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="icon" 
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
                className="h-8 w-8 text-destructive"
                onClick={handleCancel}
                disabled={mutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-success"
                onClick={handleSave}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <InlineEmptyState
            icon={Heart}
            title="Sem dados pessoais"
            description="Aniversário, família e âncoras positivas ajudam a personalizar a abordagem."
          />
        ) : (
          <div className="space-y-4">
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
                          }}
                        />
                        <Button 
                          size="icon" 
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

            {/* Âncoras */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Âncoras positivas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(isEditing ? anchors : currentAnchors).map((a, i) => (
                  <Badge 
                    key={`anchor-${i}`} 
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
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAnchor())}
                      className="h-7 text-xs flex-1"
                    />
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={addAnchor}>
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
