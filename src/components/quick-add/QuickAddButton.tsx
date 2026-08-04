import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, User, Building2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { ContactForm } from '@/components/forms/ContactForm';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { InteractionForm } from '@/components/forms/InteractionForm';
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Tables } from '@/integrations/supabase/types';

type QuickAddType = 'contact' | 'company' | 'interaction' | null;

interface QuickAddButtonProps {
  className?: string;
}

const menuItems = [
  {
    type: 'interaction' as const,
    label: 'Interação',
    icon: MessageSquare,
    color: 'bg-warning',
    delay: 0,
  },
  {
    type: 'company' as const,
    label: 'Empresa',
    icon: Building2,
    color: 'bg-success',
    delay: 0.05,
  },
  {
    type: 'contact' as const,
    label: 'Contato',
    icon: User,
    color: 'bg-primary',
    delay: 0.1,
  },
];

export const QuickAddButton = React.forwardRef<HTMLDivElement, QuickAddButtonProps>(({ className }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<QuickAddType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const { contacts, createContact, fetchContacts } = useContacts();
  const { companies, createCompany, fetchCompanies } = useCompanies();
  const { createInteraction, fetchInteractions } = useInteractions();

  const handleItemClick = (type: QuickAddType) => {
    setIsOpen(false);
    setActiveForm(type);
  };

  const handleCloseForm = () => {
    setActiveForm(null);
  };

  const handleCreateContact = async (data: Omit<Tables<'contacts'>, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    setIsSubmitting(true);
    try {
      const result = await createContact(data);
      if (result) {
        handleCloseForm();
        fetchContacts();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCompany = async (data: Omit<Tables<'companies'>, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    setIsSubmitting(true);
    try {
      const result = await createCompany(data);
      if (result) {
        handleCloseForm();
        fetchCompanies();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInteraction = async (data: Omit<Tables<'interactions'>, 'id' | 'created_at' | 'user_id'>) => {
    setIsSubmitting(true);
    try {
      const result = await createInteraction(data);
      if (result) {
        handleCloseForm();
        fetchInteractions();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormContent = () => {
    switch (activeForm) {
      case 'contact':
        return (
          <ContactForm
            companies={companies}
            onSubmit={handleCreateContact}
            onCancel={handleCloseForm}
            isSubmitting={isSubmitting}
          />
        );
      case 'company':
        return (
          <CompanyForm
            onSubmit={handleCreateCompany}
            onCancel={handleCloseForm}
            isSubmitting={isSubmitting}
          />
        );
      case 'interaction':
        return (
          <InteractionForm
            contacts={contacts}
            onSubmit={handleCreateInteraction}
            onCancel={handleCloseForm}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        ref={ref}
        className={cn(
          'z-50 flex flex-col-reverse items-center gap-3',
          className ?? 'fixed bottom-6 right-6'
        )}
      >
        <AnimatePresence>
          {isOpen && menuItems.map((item, index) => (
            <motion.button
              key={item.type}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  delay: item.delay,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.3,
                y: 20,
                transition: {
                  delay: (menuItems.length - 1 - index) * 0.03,
                  duration: 0.15,
                }
              }}
              onClick={() => handleItemClick(item.type)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-full shadow-sm',
                'text-primary-foreground font-medium text-sm',
                'hover:scale-105 active:scale-95 transition-transform',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                item.color
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              data-tour="quick-add"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Fechar menu de criação rápida' : 'Abrir menu de criação rápida'}
              aria-expanded={isOpen}
              className={cn(
                'w-14 h-14 rounded-full shadow-md flex items-center justify-center',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 active:scale-95 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                isOpen && 'bg-destructive hover:bg-destructive/90'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </motion.div>
            </motion.button>
          </TooltipTrigger>
          {!isOpen && (
            <TooltipContent side="left" className="font-medium">
              Criação rápida (⌘+N)
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {isMobile ? (
        <Sheet open={activeForm !== null} onOpenChange={() => handleCloseForm()}>
          <SheetContent
            side="bottom"
            className={activeForm === 'company' ? 'h-[90vh] overflow-hidden' : 'h-[90vh] overflow-y-auto'}
          >
            {renderFormContent()}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={activeForm !== null} onOpenChange={() => handleCloseForm()}>
          <DialogContent className={activeForm === 'company' ? 'max-w-5xl max-h-[90vh] overflow-hidden' : 'max-w-2xl max-h-[90vh] overflow-y-auto'}>
            {renderFormContent()}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

QuickAddButton.displayName = 'QuickAddButton';
