import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import {
  Eye,
  Edit,
  MessageSquare,
  Phone,
  Mail,
  Copy,
  Trash2,
  Tag,
  Star,
  StarOff,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsMenuProps {
  children: ReactNode;
  entityType: 'contact' | 'company' | 'interaction';
  entityId: string;
  entityName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  isFavorite?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onAddTag?: (tag: string) => void;
  onNewInteraction?: () => void;
}

const commonTags = [
  'VIP',
  'Urgente',
  'Follow-up',
  'Negociação',
  'Frio',
  'Quente',
];

export function QuickActionsMenu({
  children,
  entityType,
  entityId,
  entityName,
  email,
  phone,
  whatsapp,
  linkedin,
  isFavorite = false,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddTag,
  onNewInteraction,
}: QuickActionsMenuProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    const path = entityType === 'contact' 
      ? `/contatos/${entityId}`
      : entityType === 'company'
      ? `/empresas/${entityId}`
      : `/interacoes`;
    navigate(path);
  };

  const handleCopyEmail = () => {
    if (email) {
      navigator.clipboard.writeText(email)
        .then(() => toast.success('Email copiado!'))
        .catch(() => toast.error('Não foi possível copiar'));
    }
  };

  const handleCopyPhone = () => {
    if (phone) {
      navigator.clipboard.writeText(phone)
        .then(() => toast.success('Telefone copiado!'))
        .catch(() => toast.error('Não foi possível copiar'));
    }
  };

  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLinkedIn = () => {
    if (linkedin) {
      const url = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
      try {
        const parsed = new URL(url);
        if (!['linkedin.com', 'www.linkedin.com'].includes(parsed.hostname.replace(/^.*\.(?=linkedin\.com$)/, ''))) return;
        window.open(parsed.href, '_blank', 'noopener,noreferrer');
      } catch { /* invalid URL */ }
    }
  };

  const handleCall = () => {
    if (phone) {
      window.open(`tel:${phone}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${entityType === 'contact' ? 'contatos' : 'empresas'}/${entityId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: entityName,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copiado!'))
        .catch(() => toast.error('Não foi possível copiar'));
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Primary Actions */}
        <ContextMenuItem onClick={handleViewDetails}>
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalhes
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        
        {onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
            <ContextMenuShortcut>E</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {onNewInteraction && entityType === 'contact' && (
          <ContextMenuItem onClick={onNewInteraction}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Nova Interação
            <ContextMenuShortcut>I</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Contact Methods */}
        {(phone || email || whatsapp || linkedin) && (
          <>
            {phone && (
              <ContextMenuItem onClick={handleCall}>
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </ContextMenuItem>
            )}
            
            {email && (
              <ContextMenuItem onClick={handleEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </ContextMenuItem>
            )}
            
            {whatsapp && (
              <ContextMenuItem onClick={handleWhatsApp} className="text-success">
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </ContextMenuItem>
            )}
            
            {linkedin && (
              <ContextMenuItem onClick={handleLinkedIn} className="text-info">
                <ExternalLink className="w-4 h-4 mr-2" />
                LinkedIn
              </ContextMenuItem>
            )}
            
            <ContextMenuSeparator />
          </>
        )}

        {/* Copy Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {email && (
              <ContextMenuItem onClick={handleCopyEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </ContextMenuItem>
            )}
            {phone && (
              <ContextMenuItem onClick={handleCopyPhone}>
                <Phone className="w-4 h-4 mr-2" />
                Telefone
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={handleShare}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Link
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Tags */}
        {onAddTag && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Tag className="w-4 h-4 mr-2" />
              Adicionar Tag
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {commonTags.map(tag => (
                <ContextMenuItem key={tag} onClick={() => onAddTag(tag)}>
                  {tag}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Favorite */}
        {onToggleFavorite && (
          <ContextMenuItem onClick={onToggleFavorite}>
            {isFavorite ? (
              <>
                <StarOff className="w-4 h-4 mr-2" />
                Remover Favorito
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Favoritar
              </>
            )}
          </ContextMenuItem>
        )}

        <ContextMenuItem onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </ContextMenuItem>

        {/* Delete */}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
