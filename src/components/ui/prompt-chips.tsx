import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface PromptChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  category?: string;
  color?: string;
}

interface PromptChipsProps {
  chips: PromptChip[] | string[];
  onSelect: (chip: string) => void;
  className?: string;
  showIcons?: boolean;
  layout?: 'wrap' | 'scroll';
}

export const PromptChips = ({
  chips,
  onSelect,
  className,
  showIcons = true,
  layout = 'wrap'
}: PromptChipsProps) => {
  const normalizedChips: PromptChip[] = chips.map((chip, index) => 
    typeof chip === 'string' 
      ? { id: `chip-${index}`, label: chip } 
      : chip
  );

  const containerClasses = cn(
    "flex gap-2 py-1",
    layout === 'wrap' ? "flex-wrap" : "overflow-x-auto no-scrollbar pb-2",
    className
  );

  return (
    <div className={containerClasses}>
      <AnimatePresence mode="popLayout">
        {normalizedChips.map((chip, idx) => (
          <motion.div
            key={chip.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 0.2, 
              delay: idx * 0.05,
              ease: [0.23, 1, 0.32, 1] 
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(chip.label)}
              className={cn(
                "h-8 rounded-full border-border/40 bg-background/50 text-[11px] font-medium transition-all duration-300",
                "hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-sm hover:-translate-y-0.5 group",
                chip.color
              )}
            >
              {showIcons && (chip.icon || <Sparkles className="h-3 w-3 mr-1.5 text-primary/60 group-hover:text-primary transition-colors" />)}
              {chip.label}
              <ArrowRight className="h-2.5 w-2.5 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
