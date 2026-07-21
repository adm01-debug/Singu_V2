import { memo, useState } from 'react';
import {
  Globe, ExternalLink, Copy, Check, MessageSquare, Plus, Trash2,
  Linkedin, Instagram, Facebook, Twitter, Youtube,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ExternalSocialMedia } from '@/hooks/useContactRelationalData';
import { ConfidenceBadge, VerifiedBadge, SourceBadge } from './shared-badges';

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  linkedin: Linkedin, instagram: Instagram, facebook: Facebook,
  twitter: Twitter, x: Twitter, youtube: Youtube,
  website: Globe, whatsapp: MessageSquare,
};

const PLATFORMS = ['linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'website', 'outro'];

function AddSocialDialog({ onAdd }: { onAdd: (data: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    plataforma: 'linkedin', handle: '', url: '', nome_perfil: '',
  });

  const handleSubmit = () => {
    if (!form.handle.trim() && !form.url.trim()) return;
    onAdd({
      plataforma: form.plataforma,
      handle: form.handle.trim() || undefined,
      url: form.url.trim() || undefined,
      nome_perfil: form.nome_perfil.trim() || undefined,
    });
    setForm({ plataforma: 'linkedin', handle: '', url: '', nome_perfil: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Plus className="h-3 w-3 mr-1" />Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-sm">Nova Rede Social</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Select value={form.plataforma} onValueChange={(v) => setForm(p => ({ ...p, plataforma: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Handle (ex: @joaosilva)" value={form.handle} onChange={(e) => setForm(p => ({ ...p, handle: e.target.value }))} />
          <Input placeholder="URL do perfil" type="url" value={form.url} onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))} />
          <Input placeholder="Nome do perfil" value={form.nome_perfil} onChange={(e) => setForm(p => ({ ...p, nome_perfil: e.target.value }))} />
          <Button size="sm" onClick={handleSubmit} disabled={!form.handle.trim() && !form.url.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  socials: ExternalSocialMedia[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onAdd?: (data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export const SocialsCard = memo(function SocialsCard({ socials, copiedField, onCopy, onAdd, onDelete }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-secondary" />
            Redes Sociais ({socials.length})
          </span>
          {onAdd && <AddSocialDialog onAdd={onAdd} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {socials.length > 0 ? socials.map((s) => {
          const PlatformIcon = PLATFORM_ICONS[s.plataforma] || Globe;
          return (
            <div key={s.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PlatformIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[180px] flex items-center gap-0.5">
                      {s.handle || s.nome_perfil || s.plataforma}
                      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{s.handle || s.nome_perfil || s.plataforma}</span>
                  )}
                  <VerifiedBadge isVerified={s.is_verified} />
                  {s.is_active === false && (
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Inativo</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] capitalize">{s.plataforma}</Badge>
                  <ConfidenceBadge value={s.confiabilidade} />
                  <SourceBadge fonte={s.fonte || s.origem} />
                </div>
                {s.nome_perfil && s.handle && <p className="text-[10px] text-muted-foreground mt-0.5">{s.nome_perfil}</p>}
                {s.contexto && <p className="text-[10px] text-muted-foreground">{s.contexto}</p>}
                {s.observacoes && <p className="text-[10px] text-muted-foreground italic">{s.observacoes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.url && (
                  <button
                    aria-label={`Copiar URL de ${s.plataforma}`}
                    onClick={() => onCopy(s.url!, `social-${s.id}`)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {copiedField === `social-${s.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(s.id)}
                    aria-label={`Remover ${s.plataforma}`}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma rede social registrada</p>
        )}
      </CardContent>
    </Card>
  );
});
