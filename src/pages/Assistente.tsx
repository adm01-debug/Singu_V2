import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Send, Sparkles, Pin, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QUICK_PROMPTS = [
  '📊 Resuma minha semana comercial',
  '🎯 Quais contatos precisam de atenção?',
  '✉️ Escreva um e-mail de follow-up',
  '💡 Sugira próximas ações para hoje',
];

export default function Assistente() {
  const {
    threads, activeThreadId, setActiveThreadId, messages,
    sending, createThread, sendMessage, deleteThread, togglePin,
  } = useAiAssistant();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    if (!activeThreadId) {
      const thread = await createThread();
      if (!thread) return;
      // sendMessage uses activeThreadId; setActiveThreadId is async, so wait next tick
      setTimeout(() => sendMessage(content), 50);
    } else {
      await sendMessage(content);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyPrompt = (prompt: string) => {
    setInput(prompt.replace(/^[^\s]+\s/, ''));
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Assistente IA | SINGU</title>
        <meta name="description" content="Converse com seu assistente IA: insights, redação, próximos passos e análise de relacionamentos." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader backTo="/" backLabel="Dashboard" title="Assistente IA" />

        <div className="grid gap-4 lg:grid-cols-[280px_1fr] h-[calc(100vh-180px)]">
          {/* Sidebar — threads */}
          <Card className="flex flex-col">
            <div className="p-3 border-b">
              <Button size="sm" className="w-full h-8 text-xs" onClick={() => createThread()}>
                <Plus className="h-3 w-3 mr-1" /> Nova conversa
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {threads.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conversa ainda.</p>
                ) : threads.map(t => (
                  <div
                    key={t.id}
                    className={cn(
                      'group flex items-center gap-1 rounded px-2 py-1.5 cursor-pointer hover:bg-muted/50',
                      activeThreadId === t.id && 'bg-muted',
                    )}
                    onClick={() => setActiveThreadId(t.id)}
                  >
                    <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs flex-1 truncate">{t.title}</span>
                    {t.pinned && <Pin className="h-3 w-3 text-warning shrink-0" />}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); togglePin(t.id, t.pinned); }}>
                        <Pin className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Conversation */}
          <Card className="flex flex-col">
            {!activeThreadId && messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Como posso ajudar hoje?</h2>
                <p className="text-sm text-muted-foreground mb-6">Pergunte sobre contatos, peça para escrever mensagens ou sugerir ações.</p>
                <div className="grid gap-2 sm:grid-cols-2 max-w-2xl w-full">
                  {QUICK_PROMPTS.map(p => (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 justify-start"
                      onClick={() => applyPrompt(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1" ref={scrollRef as never}>
                <div className="p-4 space-y-4">
                  {messages.map(m => (
                    <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                      )}>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] opacity-70">
                          <span>{formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}</span>
                          {m.tokens_used && <Badge variant="outline" className="text-[9px] h-4 px-1">{m.tokens_used} tk</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-muted-foreground">Pensando…</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Pergunte qualquer coisa…  (Enter para enviar, Shift+Enter para nova linha)"
                  className="min-h-[44px] max-h-32 text-sm resize-none"
                  disabled={sending}
                />
                <Button size="sm" onClick={handleSend} disabled={!input.trim() || sending} className="h-11">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
