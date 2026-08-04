import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

interface Props {
  days: number;
  channels: string[];
  q: string;
  activeCount: number;
}

function describeFilters(days: number, channels: string[], q: string): string {
  const parts: string[] = [];
  if (days !== 90) parts.push(`${days}d`);
  if (channels.length > 0) {
    const labels = channels.map((c) => CHANNEL_LABELS[c] ?? c).join(', ');
    parts.push(labels);
  }
  if (q) {
    const qTrimmed = q.length > 24 ? `${q.slice(0, 24)}…` : q;
    parts.push(`"${qTrimmed}"`);
  }
  return parts.join(' · ');
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback abaixo */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function CopiarLinkFiltrosButton({ days, channels, q, activeCount }: Props) {
  const disabled = activeCount === 0;

  const handleCopy = async () => {
    if (disabled) return;
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const ok = await copyText(url);
    if (!ok) {
      toast.error('Não foi possível copiar o link');
      return;
    }
    const desc = describeFilters(days, channels, q);
    toast.success('Link copiado', {
      description: desc || 'Filtros atuais incluídos na URL',
      duration: 2000,
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            disabled={disabled}
            aria-label="Copiar link com filtros atuais"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {disabled
            ? 'Configure ao menos um filtro para gerar link'
            : 'Copiar link com filtros atuais (Shift + L)'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
