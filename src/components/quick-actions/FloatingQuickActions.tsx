import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  UserPlus, 
  Building2, 
  MessageSquare, 
  CalendarPlus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useButtonHaptic } from '@/hooks/useHapticFeedback';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  action: () => void;
}

interface FloatingQuickActionsProps {
  onCreateContact?: () => void;
  onCreateCompany?: () => void;
  onCreateInteraction?: () => void;
  onOpenSearch?: () => void;
  className?: string;
}

export function FloatingQuickActions({
  onCreateContact,
  onCreateCompany,
  onCreateInteraction,
  onOpenSearch,
  className,
}: FloatingQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { onPress } = useButtonHaptic();

  const actions: QuickAction[] = [
    {
      id: 'contact',
      icon: UserPlus,
      label: 'Novo Contato',
      color: 'bg-primary hover:bg-primary/90',
      action: () => {
        if (onCreateContact) {
          onCreateContact();
        } else {
          navigate('/contatos?action=create');
        }
        setIsOpen(false);
      },
    },
    {
      id: 'company',
      icon: Building2,
      label: 'Nova Empresa',
      color: 'bg-success hover:bg-success/90',
      action: () => {
        if (onCreateCompany) {
          onCreateCompany();
        } else {
          navigate('/empresas?action=create');
        }
        setIsOpen(false);
      },
    },
    {
      id: 'interaction',
      icon: MessageSquare,
      label: 'Nova Interação',
      color: 'bg-accent hover:bg-accent/90',
      action: () => {
        if (onCreateInteraction) {
          onCreateInteraction();
        } else {
          navigate('/interacoes?action=create');
        }
        setIsOpen(false);
      },
    },
    {
      id: 'calendar',
      icon: CalendarPlus,
      label: 'Agendar',
      color: 'bg-warning hover:bg-warning/90',
      action: () => {
        navigate('/calendario');
        setIsOpen(false);
      },
    },
    {
      id: 'search',
      icon: Search,
      label: 'Buscar',
      color: 'bg-muted-foreground hover:bg-muted-foreground/90',
      action: () => {
        onOpenSearch?.();
        setIsOpen(false);
      },
    },
  ];

  const toggleMenu = useCallback(() => {
    onPress();
    setIsOpen(prev => !prev);
  }, [onPress]);

  // Animation variants
  const menuVariants = {
    closed: { scale: 0, opacity: 0 },
    open: { scale: 1, opacity: 1 },
  };

  const itemVariants = {
    closed: { y: 20, opacity: 0 },
    open: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.05 },
    }),
  };

  return (
    <div className={cn('fixed bottom-28 md:bottom-6 right-4 md:right-6 z-50', className)}>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick actions menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="absolute bottom-16 right-0 space-y-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                custom={actions.length - 1 - index}
                variants={itemVariants}
                className="flex items-center justify-end gap-3"
              >
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (actions.length - 1 - index) * 0.05 + 0.1 }}
                  className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap"
                >
                  {action.label}
                </motion.span>
                <Button
                  size="icon"
                  className={cn('h-12 w-12 rounded-full shadow-sm text-primary-foreground', action.color)}
                  onClick={action.action}
                  aria-label={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Button
          size="icon"
          onClick={toggleMenu}
          aria-label={isOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
          className={cn(
            'h-14 w-14 rounded-full shadow-sm transition-all',
            isOpen
              ? 'bg-destructive hover:bg-destructive/90'
              : 'bg-primary hover:bg-primary/90'
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      </motion.div>
    </div>
  );
}

// Mini version for mobile
export function MiniFloatingAction({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-sm flex items-center justify-center md:hidden"
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  );
}
