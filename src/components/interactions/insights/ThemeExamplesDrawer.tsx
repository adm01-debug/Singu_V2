import { memo, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, Loader2, Quote, RotateCcw, Eraser, AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTopicsCatalog } from "@/hooks/useConversationIntel";
import { extractExcerpts, type Excerpt, type MatchMode } from "@/lib/insights/extractExcerpts";

const MATCH_MODE_STORAGE_KEY = "themeDrawer.matchMode";
const isMatchMode = (v: unknown): v is MatchMode => v === "exact" || v === "partial";
import { pickTopPassages } from "@/lib/insights/pickTopPassages";
import {
  DEFAULT_EXCERPT_PRESET,
  EXCERPT_PRESET_STORAGE_KEY,
  getExcerptWindow,
  getFallbackWindow,
  isExcerptWindowPreset,
  type ExcerptWindowPreset,
} from "@/lib/insights/excerptWindow";
import { cn } from "@/lib/utils";
import type { ThemeAggregate } from "@/hooks/useInteractionsInsights";
import { useUiPreferencesSync } from "@/hooks/useUiPreferencesSync";

const THEME_DRAWER_PREFS_SCOPE = "insights:theme-drawer";
interface ThemeDrawerPrefs extends Record<string, unknown> {
  excerptPreset: ExcerptWindowPreset;
  matchMode: MatchMode;
}
const THEME_DRAWER_DEFAULTS: ThemeDrawerPrefs = {
  excerptPreset: DEFAULT_EXCERPT_PRESET,
  matchMode: "exact",
};
function sanitizeThemeDrawerPrefs(raw: unknown): ThemeDrawerPrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    excerptPreset: isExcerptWindowPreset(r.excerptPreset)
      ? r.excerptPreset
      : DEFAULT_EXCERPT_PRESET,
    matchMode: isMatchMode(r.matchMode) ? r.matchMode : "exact",
  };
}

interface Props {
  theme: ThemeAggregate | null;
  onClose: () => void;
}

interface InteractionRow {
  id: string;
  title: string | null;
  type: string | null;
  created_at: string | null;
  content: string | null;
  transcription: string | null;
  contact_id: string | null;
  sentiment: string | null;
}

function normalizeKey(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Conta ocorrências de cada termo dentro de `text` (sempre case/acento-insensível).
 * - matchMode "exact": whole-word (delimitado por não-letra/não-dígito).
 * - matchMode "partial": substring livre.
 */
function countTermMatches(
  text: string,
  terms: string[],
  matchMode: MatchMode = "exact",
): Map<string, number> {
  const result = new Map<string, number>();
  if (!text) return result;
  const norm = normalizeText(text);
  for (const t of terms) {
    const trimmed = typeof t === "string" ? t.trim() : "";
    if (trimmed.length < 2) {
      result.set(t, 0);
      continue;
    }
    const escaped = escapeRegex(normalizeText(trimmed));
    const pattern =
      matchMode === "exact"
        ? `(?:^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`
        : `(${escaped})`;
    const re = new RegExp(pattern, "giu");
    let count = 0;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(norm)) !== null) {
      count += 1;
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
    result.set(t, count);
  }
  return result;
}

interface Segment {
  text: string;
  isMatch: boolean;
}

const MarkExcerpt = memo(function MarkExcerpt({
  text,
  terms,
  matchMode = "exact",
}: {
  text: string;
  terms: string[];
  matchMode?: MatchMode;
}) {
  const segments = useMemo<Segment[]>(() => {
    if (!text) return [];
    // Guarda defensiva: sem termos reais, n\u00e3o destacar nada (modo fallback / sem keywords).
    if (!Array.isArray(terms) || terms.length === 0) return [{ text, isMatch: false }];
    const cleaned = Array.from(
      new Map(
        terms
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length >= 2)
          .map((t) => [normalizeText(t), t] as const),
      ).values(),
    ).sort((a, b) => b.length - a.length);

    if (cleaned.length === 0) return [{ text, isMatch: false }];

    const escaped = cleaned.map((t) => escapeRegex(normalizeText(t)));
    const pattern =
      matchMode === "exact"
        ? `(?:^|[^\\p{L}\\p{N}])(${escaped.join("|")})(?=$|[^\\p{L}\\p{N}])`
        : `(${escaped.join("|")})`;
    const re = new RegExp(pattern, "giu");
    const norm = normalizeText(text);
    const out: Segment[] = [];
    let cursor = 0;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(norm)) !== null) {
      const start = m.index + (m[0].length - m[1].length);
      const end = start + m[1].length;
      if (start > cursor) out.push({ text: text.slice(cursor, start), isMatch: false });
      out.push({ text: text.slice(start, end), isMatch: true });
      cursor = end;
      if (end === m.index) re.lastIndex += 1;
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor), isMatch: false });
    return out;
  }, [text, terms, matchMode]);

  if (segments.length === 0) return <>{text}</>;
  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark key={i} className="bg-warning/30 text-foreground rounded px-0.5">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
});

const ExcerptItem = memo(function ExcerptItem({
  excerpt,
  interaction,
  terms,
  matchCount,
  matchMode,
  onClose,
}: {
  excerpt: Excerpt;
  interaction: InteractionRow | undefined;
  terms: string[];
  matchCount?: number;
  matchMode?: MatchMode;
  onClose: () => void;
}) {
  return (
    <article className="rounded-md border border-border/60 bg-card p-3 space-y-2">
      <div className="flex gap-2">
        <Quote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
        <p className="text-sm text-foreground leading-relaxed">
          <MarkExcerpt text={excerpt.text} terms={terms} matchMode={matchMode} />
        </p>
        {typeof matchCount === "number" && matchCount > 0 && (
          <Badge
            variant="outline"
            className="h-5 shrink-0 text-[10px] bg-warning/10 border-warning/40"
            title={`${matchCount} ocorrência${matchCount === 1 ? "" : "s"} de keywords neste trecho`}
          >
            {matchCount}
          </Badge>
        )}
      </div>
      <footer className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <span className="text-[10px] text-muted-foreground truncate">
          {interaction?.title ?? "Sem título"} · {interaction?.type ?? "—"}
          {interaction?.created_at ? ` · ${new Date(interaction.created_at).toLocaleDateString("pt-BR")}` : ""}
        </span>
        {interaction?.contact_id && (
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1 shrink-0">
            <Link to={`/contatos/${interaction.contact_id}/ficha-360`} onClick={onClose}>
              Ficha 360 <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </footer>
    </article>
  );
});

export function ThemeExamplesDrawer({ theme, onClose }: Props) {
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: topics } = useTopicsCatalog();

  const [preset, setPreset] = useState<ExcerptWindowPreset>(() => {
    if (typeof window === "undefined") return DEFAULT_EXCERPT_PRESET;
    try {
      const v = window.localStorage.getItem(EXCERPT_PRESET_STORAGE_KEY);
      return isExcerptWindowPreset(v) ? v : DEFAULT_EXCERPT_PRESET;
    } catch {
      return DEFAULT_EXCERPT_PRESET;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Quando o preset volta ao default, removemos a chave para "limpar" o override
      // salvo anteriormente — assim o pr\u00f3ximo carregamento usa puramente o default.
      if (preset === DEFAULT_EXCERPT_PRESET) {
        window.localStorage.removeItem(EXCERPT_PRESET_STORAGE_KEY);
      } else {
        window.localStorage.setItem(EXCERPT_PRESET_STORAGE_KEY, preset);
      }
    } catch {
      /* ignore quota / private mode errors */
    }
  }, [preset]);

  const resetWindow = () => {
    setPreset(DEFAULT_EXCERPT_PRESET);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(EXCERPT_PRESET_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  const [matchMode, setMatchMode] = useState<MatchMode>(() => {
    if (typeof window === "undefined") return "exact";
    try {
      const v = window.localStorage.getItem(MATCH_MODE_STORAGE_KEY);
      return isMatchMode(v) ? v : "exact";
    } catch {
      return "exact";
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MATCH_MODE_STORAGE_KEY, matchMode);
    } catch {
      /* ignore quota / private mode errors */
    }
  }, [matchMode]);

  // Sincroniza preset + matchMode com o perfil no Supabase (cross-device).
  // localStorage permanece como fallback offline / pré-hidratação.
  const currentPrefs = useMemo<ThemeDrawerPrefs>(
    () => ({ excerptPreset: preset, matchMode }),
    [preset, matchMode],
  );
  useUiPreferencesSync<ThemeDrawerPrefs>({
    scope: THEME_DRAWER_PREFS_SCOPE,
    current: currentPrefs,
    defaults: THEME_DRAWER_DEFAULTS,
    sanitize: sanitizeThemeDrawerPrefs,
    hydrate: (remote) => {
      setPreset(remote.excerptPreset);
      setMatchMode(remote.matchMode);
    },
    hasUrlOverride: false,
  });

  useEffect(() => {
    if (!theme || !theme.examples.length) {
      setInteractions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, title, type, created_at, content, transcription, contact_id, sentiment")
        .in("id", theme.examples)
        .limit(500);
      if (!cancelled) {
        if (!error && Array.isArray(data)) setInteractions(data as InteractionRow[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [theme]);

  const keywords = useMemo(() => {
    if (!theme) return [];
    const labelKey = normalizeKey(theme.label);
    if (Array.isArray(topics)) {
      const match = topics.find((t) => normalizeKey(t.label) === labelKey);
      if (match && Array.isArray(match.keywords) && match.keywords.length > 0) {
        return [theme.label, ...match.keywords];
      }
    }
    return [theme.label];
  }, [theme, topics]);

  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Reset seleção sempre que o conjunto de keywords mudar (novo tema/catálogo).
  useEffect(() => {
    setSelectedKeywords(new Set(keywords.map((k) => normalizeKey(k))));
  }, [keywords]);

  const effectiveKeywords = useMemo(
    () => keywords.filter((k) => selectedKeywords.has(normalizeKey(k))),
    [keywords, selectedKeywords],
  );

  const allCleared = selectedKeywords.size === 0;
  const allSelected = selectedKeywords.size === keywords.length && keywords.length > 0;

  const toggleKeyword = (kw: string) => {
    const key = normalizeKey(kw);
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearKeywords = () => setSelectedKeywords(new Set());
  const restoreKeywords = () =>
    setSelectedKeywords(new Set(keywords.map((k) => normalizeKey(k))));

  const excerpts = useMemo(() => {
    if (!Array.isArray(interactions) || interactions.length === 0) return [];
    if (effectiveKeywords.length === 0) return [];
    const sources = interactions.map((i) => ({
      id: i.id,
      text: (i.transcription && i.transcription.length > 0 ? i.transcription : i.content) ?? "",
    }));
    return extractExcerpts(sources, effectiveKeywords, {
      totalCap: 5,
      maxPerSource: 2,
      window: getExcerptWindow(preset),
      matchMode,
    });
  }, [interactions, effectiveKeywords, preset, matchMode]);

  const fallbackPassages = useMemo(() => {
    if (excerpts.length > 0) return [];
    if (!Array.isArray(interactions) || interactions.length === 0) return [];
    const sources = interactions.map((i) => ({
      id: i.id,
      text: (i.transcription && i.transcription.length > 0 ? i.transcription : i.content) ?? "",
    }));
    return pickTopPassages(sources, {
      totalCap: 5,
      maxPerSource: 2,
      window: getFallbackWindow(preset),
    });
  }, [excerpts, interactions, preset]);

  const isFallback = excerpts.length === 0 && fallbackPassages.length > 0;
  const rawDisplayItems = excerpts.length > 0 ? excerpts : fallbackPassages;

  // Computa, em uma \u00fanica passagem, contagens por excerto + ranking por relev\u00e2ncia.
  // Relev\u00e2ncia = (qtde de keywords distintas encontradas, depois total de ocorr\u00eancias).
  // Em fallback ou sem keywords ativas, mant\u00e9m a ordem original.
  const ranked = useMemo(() => {
    const enriched = rawDisplayItems.map((ex, i) => {
      const originalKey = `${ex.interactionId}-${ex.position}-${i}`;
      if (isFallback || effectiveKeywords.length === 0) {
        return { ex, originalIndex: i, originalKey, total: 0, distinct: 0 };
      }
      const counts = countTermMatches(ex.text, effectiveKeywords, matchMode);
      let total = 0;
      let distinct = 0;
      counts.forEach((n) => {
        if (n > 0) {
          distinct += 1;
          total += n;
        }
      });
      return { ex, originalIndex: i, originalKey, total, distinct };
    });

    if (isFallback || effectiveKeywords.length === 0) return enriched;

    return [...enriched].sort((a, b) => {
      if (b.distinct !== a.distinct) return b.distinct - a.distinct;
      if (b.total !== a.total) return b.total - a.total;
      return a.originalIndex - b.originalIndex;
    });
  }, [rawDisplayItems, effectiveKeywords, isFallback, matchMode]);

  const displayItems = useMemo(() => ranked.map((r) => r.ex), [ranked]);

  const interactionMap = useMemo(() => {
    const m = new Map<string, InteractionRow>();
    for (const i of interactions) m.set(i.id, i);
    return m;
  }, [interactions]);

  const sourcesCount = useMemo(
    () => new Set(displayItems.map((e) => e.interactionId)).size,
    [displayItems],
  );

  // Contagem de matches por excerto exibido (chave = originalKey, est\u00e1vel mesmo ap\u00f3s sort).
  const perExcerptCounts = useMemo(() => {
    const out = new Map<string, number>();
    for (const r of ranked) out.set(r.originalKey, r.total);
    return out;
  }, [ranked]);

  // Resumo agregado: quais keywords foram efetivamente encontradas e quantas vezes.
  const keywordSummary = useMemo(() => {
    const totals = new Map<string, number>();
    for (const kw of effectiveKeywords) totals.set(kw, 0);
    if (isFallback || effectiveKeywords.length === 0) {
      return { totals, found: [] as Array<{ term: string; count: number }>, totalMatches: 0 };
    }
    for (const r of ranked) {
      const counts = countTermMatches(r.ex.text, effectiveKeywords, matchMode);
      counts.forEach((n, term) => totals.set(term, (totals.get(term) ?? 0) + n));
    }
    const found = Array.from(totals.entries())
      .filter(([, n]) => n > 0)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count);
    const totalMatches = found.reduce((acc, f) => acc + f.count, 0);
    return { totals, found, totalMatches };
  }, [ranked, effectiveKeywords, isFallback, matchMode]);

  return (
    <Sheet open={!!theme} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {theme?.label}
            {theme && (
              <Badge variant="outline" className="text-[10px]">
                {theme.category}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {theme ? `${theme.mentions} menções em ${theme.count} conversas` : ""}
          </SheetDescription>
          <div
            className="flex items-center flex-wrap gap-1.5 pt-1"
            role="group"
            aria-label="Tamanho do trecho exibido"
            title="Tamanho do trecho exibido"
          >
            <span className="text-[10px] text-muted-foreground mr-1">Trecho:</span>
            {(["short", "medium", "long"] as const).map((p) => {
              const chars = getExcerptWindow(p);
              const label = p === "short" ? "Curto" : p === "medium" ? "Médio" : "Longo";
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  aria-pressed={preset === p}
                  title={`${label} · ~${chars} caracteres por excerto`}
                  className={cn(
                    "h-6 px-2 rounded text-[11px] font-medium border transition-colors inline-flex items-center gap-1",
                    preset === p
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30",
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      "text-[9px] tabular-nums",
                      preset === p ? "text-muted-foreground" : "text-muted-foreground/70",
                    )}
                    aria-hidden="true"
                  >
                    ~{chars}
                  </span>
                </button>
              );
            })}
            <span
              className="text-[10px] text-muted-foreground tabular-nums ml-1"
              aria-live="polite"
              title={`Janela atual: ~${getExcerptWindow(preset)} caracteres por excerto · ~${getFallbackWindow(preset)} no modo fallback`}
            >
              ≈ {getExcerptWindow(preset)} chars
              <span className="text-muted-foreground/70"> · fallback ~{getFallbackWindow(preset)}</span>
            </span>
            {preset !== DEFAULT_EXCERPT_PRESET && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 ml-1 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                onClick={resetWindow}
                title="Restaurar o tamanho do trecho para o padrão (Médio) e limpar o valor salvo"
                aria-label="Resetar janela do trecho para o padrão Médio"
              >
                <RotateCcw className="h-3 w-3" /> Resetar janela
              </Button>
            )}
          </div>

          <div
            className="flex items-center gap-1.5 pt-1"
            role="group"
            aria-label="Modo de correspondência das keywords"
            title="Como as keywords são comparadas no destaque (sempre case e acento-insensível)"
          >
            <span className="text-[10px] text-muted-foreground mr-1">Match:</span>
            {(["exact", "partial"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMatchMode(mode)}
                aria-pressed={matchMode === mode}
                title={
                  mode === "exact"
                    ? "Apenas palavras inteiras (ex.: “preço” não casa com “preçoso”)"
                    : "Substring livre (ex.: “preço” casa dentro de “precificação”)"
                }
                className={cn(
                  "h-6 px-2 rounded text-[11px] font-medium border transition-colors",
                  matchMode === mode
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30",
                )}
              >
                {mode === "exact" ? "Exato" : "Parcial"}
              </button>
            ))}
          </div>

          {keywords.length > 0 && (
            <div className="pt-2 space-y-1.5" role="group" aria-label="Filtro de keywords destacadas">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Keywords destacadas{" "}
                  <span className="text-muted-foreground/70">
                    ({selectedKeywords.size}/{keywords.length})
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {!allSelected && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] gap-1"
                      onClick={restoreKeywords}
                      title="Restaurar todas as keywords"
                    >
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1"
                    onClick={clearKeywords}
                    disabled={allCleared}
                    title="Remover todas as keywords selecionadas"
                  >
                    <Eraser className="h-3 w-3" /> Limpar filtros
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw) => {
                  const key = normalizeKey(kw);
                  const active = selectedKeywords.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleKeyword(kw)}
                      aria-pressed={active}
                      className={cn(
                        "h-6 px-2 rounded-full text-[11px] font-medium border transition-colors",
                        active
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 line-through opacity-70",
                      )}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando excertos…
            </div>
          )}

          {!loading && displayItems.length > 0 && (
            <>
              {isFallback && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-md border border-warning/40 bg-warning/10 p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-warning" aria-hidden="true" />
                        Sugestões aproximadas — sem menções diretas
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Não encontramos menções literais das keywords deste tema nas transcrições.
                        Estamos exibindo as <strong className="font-medium text-foreground">{displayItems.length} passagem
                        {displayItems.length === 1 ? "" : "ns"}</strong> mais relevantes como{" "}
                        <strong className="font-medium text-foreground">sugestão de leitura</strong>{" "}
                        — interprete-as como contexto provável, e não como evidência direta do tema.
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                        Dica: tente o modo de match <strong className="font-medium">“Parcial”</strong> ou
                        revise as keywords selecionadas acima para encontrar menções literais.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isFallback && (
                <p className="text-xs text-muted-foreground">
                  {displayItems.length} excerto{displayItems.length === 1 ? "" : "s"} de {sourcesCount} conversa
                  {sourcesCount === 1 ? "" : "s"}
                </p>
              )}

              {!isFallback && effectiveKeywords.length > 0 && (
                <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                      Resumo de keywords encontradas
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {keywordSummary.totalMatches} ocorrência
                      {keywordSummary.totalMatches === 1 ? "" : "s"} ·{" "}
                      {keywordSummary.found.length}/{effectiveKeywords.length} keyword
                      {effectiveKeywords.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {keywordSummary.found.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {keywordSummary.found.map(({ term, count }) => (
                        <Badge
                          key={term}
                          variant="outline"
                          className="text-[10px] gap-1 bg-warning/10 border-warning/40 text-foreground"
                        >
                          <span className="truncate max-w-[140px]">{term}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="tabular-nums">{count}</span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      Nenhuma ocorrência literal das keywords selecionadas nos excertos exibidos.
                    </p>
                  )}
                </div>
              )}

              {ranked.map((r) => (
                <ExcerptItem
                  key={r.originalKey}
                  excerpt={r.ex}
                  interaction={interactionMap.get(r.ex.interactionId)}
                  // Em fallback n\u00e3o h\u00e1 menções reais → desabilita destaque, contagem e match mode.
                  terms={isFallback ? [] : effectiveKeywords}
                  matchCount={isFallback ? undefined : perExcerptCounts.get(r.originalKey)}
                  matchMode={isFallback ? undefined : matchMode}
                  onClose={onClose}
                />
              ))}
            </>
          )}

          {/*
            Bloco intermediário: temos interações no período, mas nenhuma passagem
            (nem excerto literal, nem sugestão do fallback) pôde ser extraída.
            Mostramos cards "crus" das interações como último recurso.
          */}
          {!loading &&
            displayItems.length === 0 &&
            interactions.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground italic">
                  Sem passagens recortáveis nas transcrições deste período. Mostrando as interações
                  relacionadas para você abrir manualmente.
                </p>
                {interactions.map((ex) => (
                  <article key={ex.id} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
                    <header className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium text-foreground truncate">{ex.title ?? "Sem título"}</h4>
                      {ex.sentiment && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {ex.sentiment}
                        </Badge>
                      )}
                    </header>
                    {ex.content && <p className="text-xs text-muted-foreground line-clamp-3">{ex.content}</p>}
                    <footer className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {ex.type} · {ex.created_at ? new Date(ex.created_at).toLocaleDateString("pt-BR") : ""}
                      </span>
                      {ex.contact_id && (
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1">
                          <Link to={`/contatos/${ex.contact_id}/ficha-360`} onClick={onClose}>
                            Ficha 360 <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </footer>
                  </article>
                ))}
              </>
            )}

          {/*
            Estado vazio "real": só aparece quando NÃO há matches literais,
            NEM passagens sugeridas pelo fallback, NEM interações brutas no período.
            Tipicamente: filtro de período sem dados ou tema sem nenhum exemplo associado.
          */}
          {!loading &&
            displayItems.length === 0 &&
            interactions.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
                <Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">Nenhum exemplo disponível</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Não encontramos interações associadas a este tema no período selecionado. Ajuste o
                  intervalo de datas ou tente outro tema para ver passagens relacionadas.
                </p>
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
