import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
 import { Mail, Plus, Send, FileEdit, Trash2, Eye, Clock, CheckCircle2, Search, BarChart3, Megaphone, Layout, ListFilter } from 'lucide-react';
 import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEmailCampaigns, EmailCampaign } from '@/hooks/useEmailCampaigns';
import { SegmentBuilderPanel } from '@/components/segmentation/SegmentBuilderPanel';
import { CampaignDetailDrawer } from '@/components/campaigns/CampaignDetailDrawer';
import { EmailBuilder } from '@/components/email-builder/EmailBuilder';
import type { EmailBlock } from '@/components/email-builder/types';
import { renderBlocksToHtml, renderBlocksToText } from '@/lib/emailBuilderRenderer';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', icon: FileEdit, color: 'text-muted-foreground' },
  scheduled: { label: 'Agendada', icon: Clock, color: 'text-blue-500' },
  sending: { label: 'Enviando', icon: Send, color: 'text-yellow-500' },
  sent: { label: 'Enviada', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Cancelada', icon: Trash2, color: 'text-red-500' },
};

export default function Campanhas() {
  const { campaigns, isLoading, create, remove, sendCampaign, stats } = useEmailCampaigns();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [contentText, setContentText] = useState('');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.subject.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, statusFilter, search]);

  const handleCreate = () => {
    if (!name.trim() || !subject.trim()) return;
    const hasBlocks = blocks.length > 0;
    create.mutate({
      name,
      subject,
      content_text: hasBlocks ? renderBlocksToText(blocks) : contentText,
      content_html: hasBlocks ? renderBlocksToHtml(blocks) : null,
    });
    setName(''); setSubject(''); setContentText(''); setBlocks([]);
    setShowNew(false);
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Campanhas | SINGU</title>
        <meta name="description" content="Gerencie campanhas de email marketing com segmentação e métricas." />
      </Helmet>
       <div className="min-h-screen p-4 md:p-6 space-y-6">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
           <div className="space-y-1">
             <div className="flex items-center gap-2 mb-1">
               <div className="p-1.5 rounded-lg bg-primary/10">
                 <Megaphone className="w-5 h-5 text-primary" />
               </div>
               <h1 className="text-2xl font-bold tracking-tight">Email Marketing & Campanhas</h1>
             </div>
             <p className="text-sm text-muted-foreground max-w-2xl">
               Crie, dispare e analise campanhas de email de alto impacto.
               Use segmentação avançada para atingir o lead certo.
             </p>
           </div>
           <div className="flex items-center gap-2">
             <Button asChild variant="outline" size="sm" className="gap-2 h-9">
               <Link to="/marketing">
                 <BarChart3 className="w-4 h-4" /> Marketing Hub
               </Link>
             </Button>
             <Button asChild variant="outline" size="sm" className="gap-2 h-9 text-primary border-primary/20 bg-primary/5">
               <Link to="/campanhas">
                 <Megaphone className="w-4 h-4" /> Email Marketing
               </Link>
             </Button>
           </div>
         </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Mail },
            { label: 'Rascunhos', value: stats.drafts, icon: FileEdit },
            { label: 'Enviadas', value: stats.sent, icon: Send },
            { label: 'Taxa Abertura', value: `${stats.avgOpenRate}%`, icon: Eye },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar campanhas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowNew(true)} className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Nova Campanha
          </Button>
        </div>

        {/* Campaign List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha encontrada.</p>
            ) : (
              <div className="divide-y">
                {filtered.map(campaign => {
                  const status = STATUS_CONFIG[campaign.status];
                  const StatusIcon = status.icon;
                  const openRate = campaign.total_recipients > 0 ? Math.round((campaign.total_opened / campaign.total_recipients) * 100) : 0;
                  const clickRate = campaign.total_recipients > 0 ? Math.round((campaign.total_clicked / campaign.total_recipients) * 100) : 0;
                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon className={`h-4 w-4 shrink-0 ${status.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{campaign.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">📧 {campaign.subject}</span>
                            <Badge variant="secondary" className="text-[10px] h-4">{status.label}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                        {campaign.status === 'sent' && (
                          <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>{campaign.total_recipients} destinatários</span>
                            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{openRate}%</span>
                            <span className="flex items-center gap-0.5"><BarChart3 className="h-3 w-3" />{clickRate}%</span>
                          </div>
                        )}
                        <div className="flex gap-1">
                          {campaign.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => sendCampaign.mutate(campaign.id)}
                              disabled={sendCampaign.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" /> Enviar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => remove.mutate(campaign.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Segment Builder */}
        <SegmentBuilderPanel />

        {/* New Campaign Dialog */}
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome da Campanha</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Newsletter Abril 2026" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Assunto do Email</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Novidades incríveis para você!" className="h-8 text-xs" />
                </div>
              </div>
              <Tabs defaultValue="builder">
                <TabsList className="h-7">
                  <TabsTrigger value="builder" className="text-xs h-6">Editor visual</TabsTrigger>
                  <TabsTrigger value="text" className="text-xs h-6">Apenas texto</TabsTrigger>
                </TabsList>
                <TabsContent value="builder" className="mt-2">
                  <EmailBuilder blocks={blocks} onBlocksChange={setBlocks} />
                </TabsContent>
                <TabsContent value="text" className="mt-2">
                  <Label className="text-xs">Conteúdo</Label>
                  <Textarea value={contentText} onChange={e => setContentText(e.target.value)} placeholder="Escreva o conteúdo do email..." className="text-xs min-h-[200px]" />
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)} className="text-xs">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || !subject.trim() || create.isPending} className="text-xs">Criar Campanha</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Drawer */}
        <CampaignDetailDrawer
          campaign={selectedCampaign}
          open={!!selectedCampaign}
          onOpenChange={(o) => { if (!o) setSelectedCampaign(null); }}
        />
      </div>
    </AppLayout>
  );
}
