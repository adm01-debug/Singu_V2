import { useState, useMemo, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen, FileJson, Printer, Search, Copy, Check, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Knowledge data compiled from project memories ──
interface KnowledgeSection {
  id: string;
  category: string;
  title: string;
  content: string;
}

const CATEGORIES = [
  'architecture',
  'features',
  'technical',
  'standards',
  'style',
  'ux',
  'integration',
  'auth',
  'constraints',
  'performance',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  architecture: '🏗 Arquitetura',
  features: '⚡ Funcionalidades',
  technical: '🔧 Técnico',
  standards: '📐 Padrões',
  style: '🎨 Design & Estilo',
  ux: '✨ UX',
  integration: '🔌 Integrações',
  auth: '🔐 Autenticação',
  constraints: '🚫 Restrições',
  performance: '🚀 Performance',
};

// Knowledge sections derived from memory index
const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  {
    id: 'provider-hierarchy',
    category: 'architecture',
    title: 'Provider Hierarchy & Context',
    content: `A hierarquia de Providers no App.tsx segue uma ordem rigorosa:\n\nHelmetProvider → ErrorBoundary → QueryClientProvider → CelebrationProvider → AriaLiveProvider → TooltipProvider → BrowserRouter → AuthProvider → NavigationStackProvider → EasterEggsProvider → Routes\n\nProtegido por ProviderErrorBoundary e script de lint (scripts/lint-providers.cjs).`,
  },
  {
    id: 'rbac',
    category: 'architecture',
    title: 'RBAC & Access Control',
    content: `Modelo RBAC com papéis 'admin', 'moderator' e 'user' na tabela user_roles.\nFunção has_role() (SECURITY DEFINER) para verificação.\nComponente RequireAdmin para gates de UI.\nHook useIsAdmin para verificações inline.`,
  },
  {
    id: 'external-data-proxy',
    category: 'architecture',
    title: 'External Data Proxy',
    content: `Edge Function 'external-data' como proxy para banco externo.\nAções: select, insert, update, delete, rpc.\nRate limiting: 60 req/min por IP.\nValidação Zod de todos os payloads.`,
  },
  {
    id: 'email-integration',
    category: 'architecture',
    title: 'Email Integration Boundary',
    content: `Camada de captura: Google Workspace → Cloud Pub/Sub → Webhook → banco externo.\nCamada de consumo: Edge Function lê email_logs do banco externo.\nConfigurado por vendedor individualmente.`,
  },
  {
    id: 'resilience',
    category: 'architecture',
    title: 'Resilience & Fault Tolerance',
    content: `Padrões: retry com backoff, circuit breaker, fallback gracioso.\nExternalDataCard para estados de loading/erro/vazio.\nDashboardErrorBoundary para isolamento de falhas em abas.`,
  },
  {
    id: 'security-core',
    category: 'architecture',
    title: 'Security Core',
    content: `Rate limiter in-memory para Edge Functions.\nRLS em todas as tabelas.\nAudit trail via audit_log.\nRotação de secrets monitorada em /admin/secrets-management.\nBrute force protection no login (5 tentativas / 15 min).`,
  },
  {
    id: 'contacts-management',
    category: 'features',
    title: 'Contacts Management & Intelligence',
    content: `117 colunas em 8 tabelas relacionais.\nPerfil 360° com DISC, IE, vieses cognitivos.\nScore de relacionamento automático.\nEnriquecimento via EnrichLayer, Firecrawl, Lux Intelligence.`,
  },
  {
    id: 'companies',
    category: 'features',
    title: 'Companies Management',
    content: `54+ colunas incluindo dados fiscais (CNPJ, razão social).\nMapa geográfico com clustering (Leaflet).\nHierarquia: matriz/filial, grupo econômico, cooperativa.\nIntegração com banco externo para dados de RF.`,
  },
  {
    id: 'pipeline-kanban',
    category: 'features',
    title: 'Pipeline Kanban',
    content: `Kanban de oportunidades com estágios: Lead, Qualificação, Proposta, Negociação, Fechado.\nDrag-and-drop entre estágios.\nDados de deals no banco externo via RPC proxy.`,
  },
  {
    id: 'voice-ai',
    category: 'features',
    title: 'Voice AI Agent',
    content: `ElevenLabs Scribe (STT) + Gemini NLU + ElevenLabs TTS.\n5 intenções: search, navigate, answer, create_interaction, create_reminder.\nDiagnóstico em /admin/voice-diagnostics.`,
  },
  {
    id: 'whatsapp',
    category: 'features',
    title: 'WhatsApp Enterprise',
    content: `Evolution API v2 para gestão de instâncias e chat.\nWebhook evolution-webhook para receber mensagens.\nChat em tempo real integrado ao módulo de interações.`,
  },
  {
    id: 'lux-intelligence',
    category: 'features',
    title: 'Lux Intelligence',
    content: `Enriquecimento profundo via n8n webhooks.\nConfiguração por tipo de entidade (contact/company).\nRetry com backoff exponencial (3 tentativas, 60s timeout).\nConfig em /admin/lux-config.`,
  },
  {
    id: 'disc-analyzer',
    category: 'features',
    title: 'DISC Behavioral Analysis',
    content: `Análise automática de perfil DISC via texto.\nCompatibilidade vendedor-contato.\nHistórico de análises, métricas de conversão por perfil.\nIntegração com AI Writing Assistant para adaptar comunicação.`,
  },
  {
    id: 'tasks-reminders',
    category: 'features',
    title: 'Tasks & Reminders',
    content: `Kanban de tarefas com status (pendente, em andamento, concluída).\nLembretes inteligentes baseados em cadência de contato.\nCron function smart-reminders para automação.`,
  },
  {
    id: 'react-query',
    category: 'technical',
    title: 'Server State Management',
    content: `TanStack React Query exclusivamente para server state.\nstaleTime configurado por tipo de dado.\nPrefetch em hover para navegação rápida.\nInvalidação granular por queryKey.`,
  },
  {
    id: 'edge-functions',
    category: 'technical',
    title: 'Edge Functions Standards',
    content: `Runtime: Deno.serve().\nValidação: Zod schemas.\nCORS: corsHeaders em todas as respostas.\nAuth: withAuth helper para JWT validation.\n30 funções no total (Frontend, Cron, Webhook, Health).`,
  },
  {
    id: 'logging',
    category: 'technical',
    title: 'Structured Logging',
    content: `Logger centralizado (src/lib/logger.ts).\nSem console.log em produção.\nLogs estruturados em JSON nas Edge Functions.\nCorrelation IDs para rastreamento.`,
  },
  {
    id: 'code-quality',
    category: 'standards',
    title: 'Code Quality Standards',
    content: `Padrão 'Senior Excellence' (10/10).\nAuditoria técnica em 22 dimensões.\nModularização rigorosa.\nTestes automatizados para providers.`,
  },
  {
    id: 'language',
    category: 'standards',
    title: 'Language: Portuguese Only',
    content: `Todas as respostas, documentações e textos do sistema em português brasileiro.\nNomes de variáveis e código em inglês.\nUI labels, toasts, mensagens sempre em PT-BR.`,
  },
  {
    id: 'design-system',
    category: 'style',
    title: 'Design System — Nexus Blue',
    content: `Cor primária: Nexus Blue (#4D96FF).\nTokens semânticos obrigatórios.\nTema claro/escuro com variáveis HSL.\nComponentes shadcn/ui com variantes premium, glass, gradient.`,
  },
  {
    id: 'feature-exclusions',
    category: 'constraints',
    title: 'Feature Scope Exclusions',
    content: `Proibido implementar: módulos de "Produtos" e "Propostas".\nEstas funcionalidades são gerenciadas por sistemas externos (ERP/Bitrix).`,
  },
  {
    id: 'performance-strategy',
    category: 'performance',
    title: 'Performance Strategy',
    content: `Redução de 75% nas chamadas paralelas iniciais.\nLazy loading de todas as rotas.\nMemoização agressiva em componentes de alto tráfego.\nProgressive rendering para datasets 2000+ registros.`,
  },
];

function generateMarkdown(sections: KnowledgeSection[]): string {
  const grouped = new Map<string, KnowledgeSection[]>();
  for (const s of sections) {
    const arr = grouped.get(s.category) || [];
    arr.push(s);
    grouped.set(s.category, arr);
  }

  let md = `# SINGU CRM — Knowledge Base Export\n\n`;
  md += `> Exportado em: ${new Date().toISOString()}\n`;
  md += `> Total de seções: ${sections.length}\n\n`;
  md += `## Índice\n\n`;

  for (const [cat, items] of grouped) {
    md += `### ${CATEGORY_LABELS[cat] || cat}\n`;
    for (const item of items) {
      md += `- [${item.title}](#${item.id})\n`;
    }
    md += '\n';
  }

  md += `---\n\n`;

  for (const [cat, items] of grouped) {
    md += `## ${CATEGORY_LABELS[cat] || cat}\n\n`;
    for (const item of items) {
      md += `### ${item.title} {#${item.id}}\n\n`;
      md += `${item.content}\n\n---\n\n`;
    }
  }

  return md;
}

function generateJSON(sections: KnowledgeSection[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalSections: sections.length,
    sections,
  }, null, 2);
}

export default function AdminKnowledgeExport() {
  const { isAdmin, isLoading } = useIsAdmin();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const filteredSections = useMemo(() => {
    return KNOWLEDGE_SECTIONS.filter(s => {
      if (!selectedCategories.has(s.category)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
    });
  }, [search, selectedCategories]);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} baixado com sucesso`);
  }, []);

  const handleExportMarkdown = useCallback(() => {
    downloadFile(generateMarkdown(filteredSections), 'SINGU_Knowledge_Export.md', 'text/markdown');
  }, [filteredSections, downloadFile]);

  const handleExportJSON = useCallback(() => {
    downloadFile(generateJSON(filteredSections), 'SINGU_Knowledge_Export.json', 'application/json');
  }, [filteredSections, downloadFile]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyBlock = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('Conteúdo copiado');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  }, []);

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const grouped = new Map<string, KnowledgeSection[]>();
  for (const s of filteredSections) {
    const arr = grouped.get(s.category) || [];
    arr.push(s);
    grouped.set(s.category, arr);
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Exportação de Conhecimento</h1>
            <p className="text-sm text-muted-foreground">
              {filteredSections.length} seções selecionadas para exportação
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
            <FileText className="w-4 h-4 mr-1" /> Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileJson className="w-4 h-4 mr-1" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> PDF (Print)
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar: Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no conhecimento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={selectedCategories.has(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span>{CATEGORY_LABELS[cat] || cat}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {KNOWLEDGE_SECTIONS.filter(s => s.category === cat).length}
                  </Badge>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* TOC */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Índice</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {filteredSections.map(s => (
                    <a
                      key={s.id}
                      href={`#section-${s.id}`}
                      className="block text-xs text-muted-foreground hover:text-foreground truncate py-0.5"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Content Preview */}
        <div ref={previewRef} className="space-y-4 print:space-y-2">
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-lg font-semibold mb-3">{CATEGORY_LABELS[cat] || cat}</h2>
              <div className="space-y-3">
                {items.map(section => (
                  <Card key={section.id} id={`section-${section.id}`}>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">{section.title}</h3>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleCopyBlock(section.id, section.content)}
                        >
                          {copiedId === section.id
                            ? <Check className="w-3.5 h-3.5 text-success" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                        {section.content}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma seção encontrada com os filtros atuais.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
