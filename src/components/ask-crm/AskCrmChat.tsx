import { useState, useRef, useEffect, memo } from 'react';
import { MessageSquare, Send, Trash2, Sparkles, ChevronDown, Database, Users, TrendingUp, History, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAskCrm, type AskCrmMessage } from '@/hooks/useAskCrm';
import { cn } from '@/lib/utils';
import { PromptChips, type PromptChip } from '@/components/ui/prompt-chips';

const SUGGESTIONS: PromptChip[] = [
  { id: 'total', label: 'Quantos contatos tenho no total?', icon: <Users className="h-3 w-3 mr-1.5" /> },
  { id: 'dormant', label: 'Contatos sem papo há 30 dias', icon: <History className="h-3 w-3 mr-1.5" /> },
  { id: 'top-score', label: 'Top 5 por relationship_score', icon: <TrendingUp className="h-3 w-3 mr-1.5" /> },
  { id: 'negotiation', label: 'Deals em negotiation', icon: <Database className="h-3 w-3 mr-1.5" /> },
  { id: 'negative', label: 'Sentimento negativo', icon: <AlertCircle className="h-3 w-3 mr-1.5" /> },
];


const MessageBubble = memo(({ msg }: { msg: AskCrmMessage }) => {
  const isUser = msg.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
        isUser
          ? 'bg-primary text-primary-foreground rounded-br-md'
          : 'bg-secondary/80 text-foreground rounded-bl-md'
      )}>
        <p className="whitespace-pre-wrap">{msg.content}</p>

        {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            {msg.display_type === 'number' ? (
              <div className="text-3xl font-bold text-primary py-2 text-center">
                {Object.values(msg.data[0] || {})[0] as string}
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {Object.keys(msg.data[0]).map(key => (
                      <th key={key} className="text-left px-2 py-1 border-b border-border/50 font-medium text-muted-foreground">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msg.data.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1 truncate max-w-[150px]">
                          {val === null ? '—' : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {msg.sql && !isUser && (
          <details className="mt-2">
            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
              Ver SQL
            </summary>
            <pre className="text-[10px] mt-1 bg-background/50 rounded p-1.5 overflow-x-auto font-mono">
              {msg.sql}
            </pre>
          </details>
        )}

        {msg.error && !isUser && (
          <p className="mt-1 text-[11px] text-destructive">{msg.error}</p>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

export function AskCrmChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, ask, clearMessages } = useAskCrm();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    ask(q);
  };

  const handleSuggestion = (s: string) => {
    setInput('');
    ask(s);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-8 lg:bottom-28 lg:right-10 z-40 h-12 w-12 rounded-full nexus-gradient-bg flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir Ask CRM"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-28 lg:right-10 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md overflow-hidden"
      style={{ height: '500px', maxHeight: 'calc(100vh - 160px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Ask CRM</span>
          <span className="text-[10px] text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded-full">IA</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages} aria-label="Limpar chat">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} aria-label="Fechar">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground">Pergunte qualquer coisa</p>
              <p className="text-xs text-muted-foreground mt-1">Consulte seus dados do CRM em linguagem natural</p>
            </div>
            <PromptChips 
              chips={SUGGESTIONS} 
              onSelect={handleSuggestion} 
              className="justify-center px-4"
            />
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary/80 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border/40 bg-secondary/20">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Quais contatos não falo há 15 dias?"
            className="flex-1 h-9 text-sm rounded-full bg-background border-border/50"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon" aria-label="Enviar"
            className="h-9 w-9 rounded-full shrink-0"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
