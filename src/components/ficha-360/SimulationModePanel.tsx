/**
 * Painel "Modo de testes" da Ficha 360 — sandbox para simular cenários
 * (sentimento, cadência, recência, canal) e validar regras do score.
 */
import { memo, useState } from 'react';
import { FlaskConical, RotateCcw, Save, Plus, X, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useSimulationStore,
  type SimulationSentiment,
} from '@/stores/useSimulationStore';
import { useCustomSimulationPresetsStore } from '@/stores/useCustomSimulationPresetsStore';
import { SIMULATION_PRESETS, hasActiveOverrides } from '@/domain/forecastSimulation';

interface Props {
  realScore: number;
  simulatedScore: number;
}

const SENTIMENT_OPTIONS: Array<{ value: 'none' | NonNullable<SimulationSentiment>; label: string }> = [
  { value: 'none', label: 'Sem override' },
  { value: 'positivo', label: 'Positivo' },
  { value: 'neutro', label: 'Neutro' },
  { value: 'misto', label: 'Misto' },
  { value: 'negativo', label: 'Negativo' },
];

const CHANNEL_OPTIONS: Array<{ value: string; label: string; title: string }> = [
  { value: 'WhatsApp', label: 'WhatsApp', title: 'Simular WhatsApp como canal preferido' },
  { value: 'Telefone', label: 'Telefone', title: 'Simular ligação como canal preferido' },
  { value: 'E-mail', label: 'E-mail', title: 'Simular e-mail como canal preferido' },
  { value: 'LinkedIn', label: 'LinkedIn', title: 'Simular LinkedIn como canal preferido' },
  { value: 'Reunião', label: 'Reunião', title: 'Simular reunião presencial/vídeo' },
  { value: '', label: 'Sem canal', title: 'Simular ausência de canal preferido' },
];

export const SimulationModePanel = memo(({ realScore, simulatedScore }: Props) => {
  const enabled = useSimulationStore((s) => s.enabled);
  const overrides = useSimulationStore((s) => s.overrides);
  const presetName = useSimulationStore((s) => s.presetName);
  const presetId = useSimulationStore((s) => s.presetId);
  const setEnabled = useSimulationStore((s) => s.setEnabled);
  const setOverride = useSimulationStore((s) => s.setOverride);
  const applyPreset = useSimulationStore((s) => s.applyPreset);
  const applyCustomPreset = useSimulationStore((s) => s.applyCustomPreset);
  const reset = useSimulationStore((s) => s.reset);

  const customPresets = useCustomSimulationPresetsStore((s) => s.presets);
  const savePreset = useCustomSimulationPresetsStore((s) => s.save);
  const updatePreset = useCustomSimulationPresetsStore((s) => s.update);
  const removePreset = useCustomSimulationPresetsStore((s) => s.remove);

  const activeCustom = presetId ? customPresets.find((p) => p.id === presetId) : null;
  const canSave = enabled && hasActiveOverrides(overrides);

  const [saveOpen, setSaveOpen] = useState(false);
  const [draftName, setDraftName] = useState('');

  const openSaveAsNew = () => {
    setDraftName('');
    setSaveOpen(true);
  };

  const handleSaveNew = () => {
    const name = draftName.trim();
    if (!name) {
      toast.error('Dê um nome ao preset.');
      return;
    }
    if (customPresets.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Já existe um preset com esse nome.');
      return;
    }
    const id = savePreset(name, overrides);
    applyCustomPreset(id, name, overrides);
    setSaveOpen(false);
    toast.success(`Preset "${name}" salvo.`);
  };

  const handleUpdateActive = () => {
    if (!activeCustom) return;
    updatePreset(activeCustom.id, { overrides });
    applyCustomPreset(activeCustom.id, activeCustom.name, overrides);
    toast.success(`Preset "${activeCustom.name}" atualizado.`);
  };

  const handleRemoveCustom = (id: string, name: string) => {
    removePreset(id);
    if (presetId === id) {
      // o preset ativo foi removido — mantém overrides mas limpa marcação
      useSimulationStore.setState({ presetId: null, presetName: null });
    }
    toast.success(`Preset "${name}" removido.`);
  };

  const delta = simulatedScore - realScore;

  return (
    <Card variant="outlined">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical
              className={cn('h-4 w-4', enabled ? 'text-warning' : 'text-muted-foreground')}
              aria-hidden="true"
            />
            Modo de testes
            {enabled && (
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning text-[10px]">
                Ativo
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            {enabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={reset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="sim-toggle" className="text-xs text-muted-foreground cursor-pointer">
                {enabled ? 'Ligado' : 'Desligado'}
              </Label>
              <Switch id="sim-toggle" checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-5">
          {/* Presets */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Cenários prontos
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SIMULATION_PRESETS.map((p) => (
                <Button
                  key={p.name}
                  type="button"
                  variant={presetName === p.name && !presetId ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => applyPreset(p.name, p.overrides)}
                  title={p.description}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Meus presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Meus presets
              </div>
              <div className="flex items-center gap-1.5">
                {activeCustom && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="gap-1"
                    onClick={handleUpdateActive}
                    title={`Atualizar "${activeCustom.name}" com os valores atuais`}
                  >
                    <Pencil className="h-3 w-3" />
                    Atualizar
                  </Button>
                )}
                <Popover open={saveOpen} onOpenChange={setSaveOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="gap-1"
                      onClick={openSaveAsNew}
                      disabled={!canSave}
                      title={
                        canSave
                          ? 'Salvar configuração atual como preset'
                          : 'Ajuste algum override antes de salvar'
                      }
                    >
                      <Save className="h-3 w-3" />
                      Salvar como…
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-3 space-y-2">
                    <Label htmlFor="preset-name" className="text-xs">
                      Nome do preset
                    </Label>
                    <Input
                      id="preset-name"
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNew();
                        }
                      }}
                      placeholder="Ex.: Cliente em retomada"
                      maxLength={48}
                      className="h-8 text-sm"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setSaveOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        className="gap-1"
                        onClick={handleSaveNew}
                      >
                        <Plus className="h-3 w-3" />
                        Salvar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {customPresets.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Nenhum preset salvo ainda. Ajuste os controles e clique em "Salvar como…" para
                criar o seu.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {customPresets.map((p) => {
                  const active = presetId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'inline-flex items-center rounded-md border text-xs h-7 overflow-hidden transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => applyCustomPreset(p.id, p.name, p.overrides)}
                        className="px-2 h-full flex items-center max-w-[180px] truncate"
                        title={`Aplicar preset "${p.name}"`}
                      >
                        {p.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(p.id, p.name)}
                        className={cn(
                          'h-full px-1.5 border-l flex items-center transition-colors',
                          active
                            ? 'border-primary-foreground/30 hover:bg-primary-foreground/10'
                            : 'border-border hover:bg-destructive/10 hover:text-destructive',
                        )}
                        title={`Remover preset "${p.name}"`}
                        aria-label={`Remover preset ${p.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sentimento */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sentimento</Label>
              <Select
                value={overrides.sentiment ?? 'none'}
                onValueChange={(v) =>
                  setOverride('sentiment', v === 'none' ? null : (v as SimulationSentiment))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENTIMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cadência */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Cadência (dias)</Label>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={overrides.cadence_days === 0}
                    onCheckedChange={(c) => setOverride('cadence_days', c ? 0 : null)}
                  />
                  Sem cadência
                </label>
              </div>
              <Input
                type="number"
                min={1}
                max={180}
                value={
                  overrides.cadence_days !== null && overrides.cadence_days > 0
                    ? overrides.cadence_days
                    : ''
                }
                placeholder="Ex.: 7"
                disabled={overrides.cadence_days === 0}
                onChange={(e) => {
                  const v = e.target.value;
                  setOverride('cadence_days', v === '' ? null : Math.max(1, Number(v)));
                }}
                className="h-9 text-sm"
              />
            </div>

            {/* Última interação */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Última interação</Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {overrides.last_contact_at_days_ago === null
                    ? 'Sem override'
                    : overrides.last_contact_at_days_ago === 0
                      ? 'Hoje'
                      : `Há ${overrides.last_contact_at_days_ago} dia${overrides.last_contact_at_days_ago === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  min={0}
                  max={180}
                  step={1}
                  value={[overrides.last_contact_at_days_ago ?? 0]}
                  onValueChange={([v]) => setOverride('last_contact_at_days_ago', v)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-[11px]"
                  onClick={() => setOverride('last_contact_at_days_ago', null)}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* Canal preferido */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Canal preferido</Label>
                {overrides.best_channel !== null && (
                  <button
                    type="button"
                    onClick={() => setOverride('best_channel', null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Trocar canal preferido">
                {CHANNEL_OPTIONS.map((opt) => {
                  const active = (overrides.best_channel ?? null) === opt.value;
                  return (
                    <Button
                      key={opt.label}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => setOverride('best_channel', opt.value)}
                      title={opt.title}
                      aria-pressed={active}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </div>
              <Input
                type="text"
                value={
                  overrides.best_channel !== null &&
                  !CHANNEL_OPTIONS.some((o) => o.value === overrides.best_channel)
                    ? overrides.best_channel
                    : ''
                }
                placeholder="Outro canal (opcional)"
                onChange={(e) =>
                  setOverride('best_channel', e.target.value === '' ? null : e.target.value)
                }
                className="h-8 text-xs"
              />
            </div>

            {/* Melhor horário */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Melhor horário</Label>
              <Input
                type="text"
                value={overrides.best_time ?? ''}
                placeholder="Ex.: manhã"
                onChange={(e) =>
                  setOverride('best_time', e.target.value === '' ? null : e.target.value)
                }
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Comparativo */}
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              Score real:{' '}
              <span className="font-semibold tabular-nums text-foreground">{realScore}</span>{' '}
              · Simulado:{' '}
              <span className="font-semibold tabular-nums text-foreground">{simulatedScore}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs tabular-nums',
                delta > 0 && 'border-success/40 bg-success/10 text-success',
                delta < 0 && 'border-destructive/40 bg-destructive/10 text-destructive',
                delta === 0 && 'border-border bg-muted text-muted-foreground',
              )}
            >
              {delta > 0 ? '+' : ''}
              {delta} pts
            </Badge>
            {(presetName || activeCustom) && (
              <Badge variant="outline" className="text-[10px] border-warning/40 bg-warning/10 text-warning">
                Preset:{' '}
                {activeCustom
                  ? activeCustom.name
                  : SIMULATION_PRESETS.find((p) => p.name === presetName)?.label ?? presetName}
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {!enabled && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Ative para simular cenários (sentimento, cadência, recência, canal) sem alterar os
            dados reais. O score, breakdown, recomendação e tendência recalculam ao vivo.
          </p>
        </CardContent>
      )}
    </Card>
  );
});
SimulationModePanel.displayName = 'SimulationModePanel';
