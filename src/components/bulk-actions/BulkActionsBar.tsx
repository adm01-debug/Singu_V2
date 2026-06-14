import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  X,
  Tag,
  Trash2,
  Download,
  Mail,
  Star,
  ChevronDown,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
interface BulkActionsBarProps {
  selectedIds: string[];
  totalCount: number;
  entityType: 'contacts' | 'companies' | 'interactions';
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDelete?: (ids: string[]) => Promise<void>;
  onAddTag?: (ids: string[], tag: string) => Promise<void>;
  onUpdateStage?: (ids: string[], stage: string) => Promise<void>;
  onExport?: (ids: string[]) => Promise<void>;
  onSendEmail?: (ids: string[]) => void;
  onToggleFavorite?: (ids: string[]) => Promise<void>;
}

const commonTags = [
  'VIP',
  'Urgente',
  'Follow-up',
  'Negociação',
  'Arquivado',
];

const relationshipStages = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualified_lead', label: 'Lead Qualificado' },
  { value: 'opportunity', label: 'Oportunidade' },
  { value: 'negotiation', label: 'Negociação' },
  { value: 'customer', label: 'Cliente' },
  { value: 'loyal_customer', label: 'Cliente Fiel' },
  { value: 'advocate', label: 'Advogado' },
  { value: 'at_risk', label: 'Em Risco' },
  { value: 'lost', label: 'Perdido' },
];

export function BulkActionsBar({
  selectedIds,
  totalCount,
  entityType,
  onClearSelection,
  onSelectAll,
  onDelete,
  onAddTag,
  onUpdateStage,
  onExport,
  onSendEmail,
  onToggleFavorite,
}: BulkActionsBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAdmin } = useIsAdmin();

  const selectedCount = selectedIds.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsProcessing(true);
    try {
      await onDelete(selectedIds);
      toast.success(`${selectedCount} ${entityType === 'contacts' ? 'contatos' : entityType === 'companies' ? 'empresas' : 'interações'} excluídos`);
      onClearSelection();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao excluir itens';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateStage = async (stage: string) => {
    if (!onUpdateStage) return;
    
    setIsProcessing(true);
    try {
      await onUpdateStage(selectedIds, stage);
      toast.success(`Estágio atualizado para ${selectedCount} itens`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar estágio';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!onAddTag) return;
    
    setIsProcessing(true);
    try {
      await onAddTag(selectedIds, tag);
      toast.success(`Tag "${tag}" adicionada a ${selectedCount} itens`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao adicionar tag';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;
    
    setIsProcessing(true);
    try {
      await onExport(selectedIds);
      toast.success(`${selectedCount} itens exportados`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao exportar';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!onToggleFavorite) return;
    
    setIsProcessing(true);
    try {
      await onToggleFavorite(selectedIds);
      toast.success(`${selectedCount} itens atualizados`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar favoritos';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1rem)]"
            role="region"
            aria-label={`Barra de ações em massa — ${selectedCount} selecionados`}
            aria-live="polite"
          >
            <div className="flex items-center gap-2 px-3 md:px-4 py-3 bg-card border border-border rounded-xl shadow-medium overflow-x-auto">
              {/* Selection info */}
              <div className="flex items-center gap-2 pr-4 border-r border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={isAllSelected ? onClearSelection : onSelectAll}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 mr-1" />
                  ) : (
                    <Square className="w-4 h-4 mr-1" />
                  )}
                  {isAllSelected ? 'Limpar' : 'Todos'}
                </Button>
                <span className="text-sm font-medium">
                  {selectedCount} de {totalCount} selecionados
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Add Tag */}
                {onAddTag && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isProcessing}>
                        <Tag className="w-4 h-4 mr-1" />
                        Tag
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      {commonTags.map(tag => (
                        <DropdownMenuItem 
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                        >
                          {tag}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Update Stage */}
                {entityType === 'contacts' && onUpdateStage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isProcessing}>
                        <Layers className="w-4 h-4 mr-1" />
                        Estágio
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="max-h-[300px] overflow-y-auto">
                      {relationshipStages.map(stage => (
                        <DropdownMenuItem 
                          key={stage.value}
                          onClick={() => handleUpdateStage(stage.value)}
                        >
                          {stage.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {onToggleFavorite && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleToggleFavorite}
                    disabled={isProcessing}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Favoritar
                  </Button>
                )}

                {/* Send Email */}
                {onSendEmail && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onSendEmail(selectedIds)}
                    disabled={isProcessing}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                )}

                {/* Export - Admin only */}
                {isAdmin && onExport && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleExport}
                    disabled={isProcessing}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar
                  </Button>
                )}

                {/* Delete */}
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isProcessing}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>

              {/* Close */}
              <div className="pl-4 border-l border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClearSelection}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedCount} {entityType === 'contacts' ? 'contatos' : entityType === 'companies' ? 'empresas' : 'interações'}.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
