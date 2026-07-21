import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Sparkles, History as HistoryIcon, Trash2, Save, Play, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelEmptyState } from '@/components/intel/IntelEmptyState';
import { TypewriterText } from '@/components/intel/TypewriterText';
import { SavedViewsPanel } from '@/components/intel/SavedViewsPanel';
import { useAskCrm } from '@/hooks/useAskCrm';
import { useIntelTelemetry } from '@/hooks/useIntelTelemetry';
import { useSavedAskViews } from '@/hooks/useSavedAskViews';
import { useContextualSuggestions } from '@/hooks/useContextualSuggestions';
import type { HistoryEntry } from '@/hooks/useEntityHistory';
import { DataGrid } from '@/components/intel/DataGrid';
import { intelExportUniversal, type IntelExportFormat } from '@/lib/intelExportUniversal';
import { ExportFormatMenu } from '@/components/intel/ExportFormatMenu';

const HISTORY_KEY_PREFIX = 'intel-ask-history';
const MAX_HISTORY = 10;


const COMMANDS = [
  { cmd: '/clear', desc: 'Limpar console' },
  { cmd: '/export', desc: 'Exportar última tabela em CSV' },
  { cmd: '/help', desc: 'Listar comandos' },
];

interface AskTabProps {
  onRegisterBridge?: (bridge: {
    clear: () => void;
    exportLast: () => void;
    help: () => void;
    run: (q: string) => void;
  }) => void;
  contextEntity?: HistoryEntry | null;
}

export const AskTab = ({ onRegisterBridge, contextEntity = null }: AskTabProps) => {
  const { user } = useAuth();
  const historyKey = `${HISTORY_KEY_PREFIX}-${user?.id ?? 'anon'}`;
  const { messages, loading, ask, clearMessages } = useAskCrm();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { log } = useIntelTelemetry();
  const { save: saveView } = useSavedAskViews();
  const suggestions = useContextualSuggestions(contextEntity);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [historyKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const persistHistory = useCallback((q: string) => {
    setHistory((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [historyKey]);

  const exportLastTable = useCallback((fmt: IntelExportFormat = 'csv') => {
    const lastWithData = [...messages].reverse().find((m) => Array.isArray(m.data) && m.data.length > 0);
    if (!lastWithData?.data) {
      toast.error('Nenhuma tabela disponível para exportar.');
      return;
    }
    const ok = intelExportUniversal(
      lastWithData.data as Array<Record<string, unknown>>,
      `ask-crm-${Date.now()}`,
      fmt,
    );
    if (ok) {
      log({ kind: 'export', label: `ask-crm:${fmt}`, meta: { rows: lastWithData.data.length } });
      toast.success(`Exportado em ${fmt.toUpperCase()}.`);
    }
  }, [messages, log]);

  const showHelp = useCallback(() => {
    toast.message('Comandos disponíveis', {
      description: COMMANDS.map((c) => `${c.cmd} — ${c.desc}`).join('\n'),
    });
  }, []);

  const doClear = useCallback(() => {
    clearMessages();
    toast.success('Console limpo.');
    log({ kind: 'command', label: '/clear' });
  }, [clearMessages, log]);

  const submit = useCallback((override?: string) => {
    const q = (override ?? input).trim();
    if (!q || loading) return;
    if (override === undefined) setInput('');

    if (q.startsWith('/')) {
      const cmd = q.toLowerCase().split(/\s+/)[0];
      log({ kind: 'command', label: cmd });
      if (cmd === '/clear') { doClear(); return; }
      if (cmd === '/export') { exportLastTable(); return; }
      if (cmd === '/help') { showHelp(); return; }
      toast.error(`Comando desconhecido: ${cmd}`);
      return;
    }

    persistHistory(q);
    const t0 = performance.now();
    log({ kind: 'query', label: q.slice(0, 60) });
    Promise.resolve(ask(q)).finally(() => {
      log({ kind: 'query', label: 'ask:done', durationMs: Math.round(performance.now() - t0) });
    });
  }, [input, loading, ask, doClear, exportLastTable, showHelp, persistHistory, log]);

  const lastUserQuery = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return history[0] ?? null;
  }, [messages, history]);

  useEffect(() => {
    onRegisterBridge?.({
      clear: doClear,
      exportLast: () => exportLastTable('csv'),
      help: showHelp,
      run: (q) => submit(q),
    });
  }, [onRegisterBridge, doClear, exportLastTable, showHelp, submit]);

  // Hotkey R: re-executar última query do Ask (fora de inputs)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== 'r') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (!lastUserQuery || loading) return;
      e.preventDefault();
      submit(lastUserQuery);
      toast.success('Re-executando última query…');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lastUserQuery, loading, submit]);

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  }, [messages]);

  const handleSaveView = useCallback((query: string) => {
    const name = window.prompt('Nome da view:', query.slice(0, 40));
    if (name === null) return;
    saveView(name, query);
    log({ kind: 'command', label: '/save-view', meta: { len: query.length } });
    toast.success('View salva.');
  }, [saveView, log]);

  const runFromPanel = useCallback((q: string) => {
    setInput(q);
    submit(q);
  }, [submit]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 h-[calc(100vh-260px)] min-h-[480px]">
      <SectionFrame
        title="QUERY_CONSOLE"
        meta="NL→SQL · ⌘K · R"
        className="flex flex-col"
        actions={
          <ExportFormatMenu
            onExport={(fmt) => exportLastTable(fmt)}
            disabled={!messages.some((m) => Array.isArray(m.data) && m.data.length > 0)}
            label="EXPORT"
          />
        }
      >
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[300px]" aria-live="polite">
          {messages.length === 0 && (
            <IntelEmptyState
              icon={Sparkles}
              title="AWAITING_QUERY"
              description="Pergunte em linguagem natural ou digite /help para ver os comandos disponíveis."
            />
          )}
          {messages.map((m) => {
            const rows = Array.isArray(m.data) ? m.data.length : 0;
            const isLastAssistant = m.id === lastAssistantId && m.role === 'assistant';
            return (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                <div
                  className={
                    m.role === 'user'
                      ? 'intel-card px-3 py-2 max-w-[80%] border-[hsl(var(--intel-accent)/0.5)]'
                      : 'intel-card px-3 py-2 max-w-full w-full'
                  }
                >
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <IntelBadge severity={m.error ? 'critical' : m.role === 'user' ? 'info' : 'ok'}>
                      {m.role === 'user' ? 'OPERATOR' : 'SYSTEM'}
                    </IntelBadge>
                    <span className="intel-mono text-[10px] text-muted-foreground">
                      {m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {rows > 0 && (
                      <IntelBadge severity="info">{rows} REG</IntelBadge>
                    )}
                    {m.role === 'user' && (
                      <button
                        type="button"
                        onClick={() => handleSaveView(m.content)}
                        className="ml-auto intel-mono text-[10px] text-muted-foreground hover:text-[hsl(var(--intel-accent))] inline-flex items-center gap-1"
                        aria-label="Salvar como view"
                        title="Salvar como view"
                      >
                        <Save className="h-3 w-3" aria-hidden /> SAVE
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap">
                    {isLastAssistant ? <TypewriterText text={m.content} /> : m.content}
                  </p>
                  {m.data && Array.isArray(m.data) && m.data.length > 0 && (
                    <div className="mt-2">
                      <DataGrid
                        columns={Object.keys(m.data[0] ?? {}).slice(0, 5).map((k) => ({
                          key: k, label: k.toUpperCase(), mono: true,
                        }))}
                        rows={m.data as Array<Record<string, unknown>>}
                        getRowKey={(r) => JSON.stringify(r).slice(0, 40)}
                      />
                    </div>
                  )}
                  {m.sql && (
                    <details className="mt-2">
                      <summary className="intel-eyebrow cursor-pointer">VIEW_SQL</summary>
                      <pre className="intel-mono text-[10px] bg-muted/40 p-2 rounded mt-1 overflow-x-auto">
                        {m.sql}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="intel-card px-3 py-2 inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-[hsl(var(--intel-accent))]" aria-hidden />
              <span className="intel-mono text-xs text-muted-foreground">PROCESSING…</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Pergunte ou digite /help…"
            className="intel-mono text-xs h-9"
            disabled={loading}
            aria-label="Pergunta em linguagem natural"
          />
          <Button onClick={() => submit()} disabled={loading || !input.trim()} size="sm" className="h-9" aria-label="Enviar">
            <Send className="h-3 w-3" aria-hidden />
          </Button>
        </div>
      </SectionFrame>

      <div className="space-y-3 overflow-y-auto">
        <SectionFrame title="SUGGESTED_QUERIES" meta="HINTS">
          <div className="space-y-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="w-full text-left intel-card intel-card-hover px-2 py-1.5 text-xs flex items-start gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-[hsl(var(--intel-accent))] shrink-0 mt-0.5" aria-hidden />
                <span className="text-foreground">{s}</span>
              </button>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame
          title="HISTORY"
          meta={`${history.length}/${MAX_HISTORY}`}
          actions={
            history.length > 0 ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const ok = intelExportUniversal(
                      history.map((q, i) => ({ idx: i + 1, query: q })),
                      `ask-history-${Date.now()}`,
                      'json',
                    );
                    if (ok) toast.success('Histórico exportado em JSON.');
                  }}
                  className="intel-mono text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  aria-label="Exportar histórico em JSON"
                  title="Exportar histórico (JSON)"
                >
                  <Download className="h-3 w-3" aria-hidden /> EXPORT
                </button>
                <button
                  onClick={() => { setHistory([]); localStorage.removeItem(historyKey); }}
                  className="intel-mono text-[10px] text-muted-foreground hover:text-destructive"
                  aria-label="Limpar histórico"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              </div>
            ) : null
          }
        >
          {history.length === 0 ? (
            <IntelEmptyState
              icon={HistoryIcon}
              title="EMPTY"
              description="Suas últimas perguntas aparecerão aqui."
            />
          ) : (
            <div className="space-y-1">
              {history.map((q, i) => (
                <div
                  key={`${q}-${i}`}
                  className="intel-card intel-card-hover px-2 py-1 text-[11px] flex items-start gap-1.5"
                >
                  <button
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="flex-1 text-left flex items-start gap-1.5 min-w-0"
                    aria-label={`Carregar query: ${q}`}
                  >
                    <HistoryIcon className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                    <span className="text-foreground truncate">{q}</span>
                  </button>
                  <button
                    onClick={() => submit(q)}
                    disabled={loading}
                    className="text-muted-foreground hover:text-[hsl(var(--intel-accent))] disabled:opacity-40 shrink-0"
                    aria-label={`Replay: ${q}`}
                    title="Re-executar"
                  >
                    <Play className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionFrame>

        <SavedViewsPanel onRun={runFromPanel} />
      </div>
    </div>
  );
};
