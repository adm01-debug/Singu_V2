import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CodeExample } from '@/components/docs/CodeExample';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Search, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  category: string;
  content: string;
  codeExample?: { code: string; title: string; language?: string };
}

const CATEGORIES = [
  'Arquitetura',
  'Padrões',
  'Hooks',
  'Componentes',
  'Edge Functions',
  'Segurança',
  'Integrações',
  'UX',
] as const;

const DOCS: DocSection[] = [
  {
    id: 'tanstack-query',
    title: 'TanStack Query — Regra de Ouro',
    category: 'Padrões',
    content: 'Todo fetch de dados DEVE usar TanStack Query (useQuery/useMutation). NUNCA usar useEffect para buscar dados. StaleTime de 5-30min conforme entidade.',
    codeExample: {
      title: 'Exemplo: Hook de Contatos',
      code: `const { data, isLoading } = useQuery({
  queryKey: ['contacts', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .limit(1000);
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});`,
    },
  },
  {
    id: 'external-data-proxy',
    title: 'Proxy de Dados Externos',
    category: 'Arquitetura',
    content: 'Acesso ao banco externo é 100% via Edge Function "external-data". Nunca conectar diretamente. O proxy valida tabelas, aplica filtros e roteia RPCs.',
    codeExample: {
      title: 'Chamada via proxy',
      code: `const { data } = await supabase.functions.invoke('external-data', {
  body: {
    action: 'query',
    table: 'companies',
    filters: { state: 'SP' },
    limit: 50,
  },
});`,
    },
  },
  {
    id: 'rls-policies',
    title: 'Row Level Security (RLS)',
    category: 'Segurança',
    content: 'Todas as tabelas com user_id têm RLS habilitado. Políticas usam auth.uid() = user_id. Roles via has_role() SECURITY DEFINER.',
  },
  {
    id: 'error-resilience',
    title: 'Resiliência e Fallbacks',
    category: 'Padrões',
    content: 'Sempre verificar Array.isArray() antes de iterar. Usar ExternalDataCard para estados de loading/error. Circuit breaker com backoff exponencial.',
    codeExample: {
      title: 'Padrão defensivo',
      code: `const items = Array.isArray(data) ? data : [];
const safe = items.filter(Boolean);`,
    },
  },
  {
    id: 'edge-functions',
    title: 'Edge Functions — Padrão',
    category: 'Edge Functions',
    content: 'Runtime Deno.serve(). Validação com Zod. CORS obrigatório. Rate limiting in-memory. Imports floating de esm.sh.',
    codeExample: {
      title: 'Template base',
      code: `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // ... lógica
});`,
    },
  },
  {
    id: 'file-limits',
    title: 'Limite de 400 Linhas',
    category: 'Padrões',
    content: 'Nenhum arquivo .ts/.tsx deve ultrapassar 400 linhas. Extrair subcomponentes, hooks e utilitários quando necessário.',
  },
  {
    id: 'disc-analysis',
    title: 'Análise DISC Automática',
    category: 'Integrações',
    content: 'Interações com >100 caracteres disparam análises paralelas de background: DISC, Sentimento e Vieses Cognitivos via Edge Functions.',
  },
  {
    id: 'auth-flow',
    title: 'Autenticação e RBAC',
    category: 'Segurança',
    content: 'Auth via Supabase Auth + Google OAuth. Roles em tabela separada (user_roles). Hook useIsAdmin() para verificação client-side. has_role() para RLS.',
  },
  {
    id: 'url-state',
    title: 'Persistência de Estado na URL',
    category: 'UX',
    content: 'Filtros, busca, modo de visualização e ordenação são persistidos via useSearchParams. Permite compartilhar e voltar ao estado exato.',
  },
  {
    id: 'component-patterns',
    title: 'Padrões de Componentes',
    category: 'Componentes',
    content: 'Cards flat sem sombras/gradientes. SearchableSelect para comboboxes. LoadingButton para ações assíncronas. ErrorBoundary para isolamento.',
  },
  {
    id: 'hooks-critical',
    title: 'Hooks Críticos',
    category: 'Hooks',
    content: 'useContacts: CRUD + busca fuzzy. useCompanies: sync com externo. usePipeline: Kanban + forecast. useExternalData: proxy bridge com retry.',
    codeExample: {
      title: 'useContacts',
      code: `/**
 * Hook para gestão de contatos do usuário.
 * @returns {data} Lista de contatos filtrados
 * @returns {isLoading} Estado de carregamento
 * @returns {createContact} Mutation para criar contato
 * @returns {updateContact} Mutation para atualizar
 */
const { data, isLoading, createContact } = useContacts();`,
    },
  },
  {
    id: 'provider-order',
    title: 'Hierarquia de Providers',
    category: 'Arquitetura',
    content: 'A ordem dos providers em App.tsx é crítica. HelmetProvider > QueryClient > BrowserRouter > AuthProvider > NavigationStack > Celebration > AriaLive.',
  },
];

export default function DocsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return DOCS.filter(doc => {
      const matchesCategory = !activeCategory || doc.category === activeCategory;
      const matchesSearch = !searchQuery.trim() ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DOCS.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, []);

  if (adminLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="flex gap-6 max-w-7xl print:block">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden lg:block print:hidden">
          <div className="sticky top-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors',
                  !activeCategory
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                Todas ({DOCS.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    'w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors',
                    activeCategory === cat
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  {cat} ({categoryCounts[cat] || 0})
                </button>
              ))}
            </div>

            <Separator />

            <ScrollArea className="max-h-60">
              <div className="space-y-0.5">
                {filtered.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setActiveSection(doc.id);
                      document.getElementById(`doc-${doc.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={cn(
                      'w-full text-left text-[11px] px-2 py-1 rounded truncate transition-colors',
                      activeSection === doc.id
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Documentação Técnica</h1>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} seções • Referência interna do SINGU
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
          </div>

          {/* Mobile search */}
          <div className="lg:hidden print:hidden relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Separator className="print:hidden" />

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma seção encontrada para "{searchQuery}"
              </CardContent>
            </Card>
          ) : (
            filtered.map(doc => (
              <Card key={doc.id} id={`doc-${doc.id}`} className="scroll-mt-4">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold">{doc.title}</h2>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {doc.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.content}
                  </p>
                  {doc.codeExample && (
                    <CodeExample
                      code={doc.codeExample.code}
                      title={doc.codeExample.title}
                      language={doc.codeExample.language}
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Print-friendly styles */}
      <style>{`
        @media print {
          nav, aside, header, .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { font-size: 11px; }
        }
      `}</style>
    </AdminLayout>
  );
}
