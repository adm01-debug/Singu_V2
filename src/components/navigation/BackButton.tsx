 import { useState } from 'react';
 import { ArrowLeft, History } from 'lucide-react';
 import { motion } from 'framer-motion';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
   DropdownMenuLabel,
 } from '@/components/ui/dropdown-menu';
 import { cn } from '@/lib/utils';
 import { safeNavigationPath, useNavigationStack } from '@/contexts/NavigationStackContext';
 import { useNavigate } from 'react-router-dom';
 import { getReadableLabel } from '@/lib/navigationLabels';

interface BackButtonProps {
  /** Explicit path to navigate to. If omitted, uses internal navigation stack. */
  to?: string;
  fallback?: string;
  /** Label shown next to the arrow. Defaults to "Voltar". */
  label?: string;
  /** Visual variant */
  variant?: 'default' | 'ghost' | 'overlay';
  /** Additional classes */
  className?: string;
  /** Whether to show the label on mobile */
  showLabelOnMobile?: boolean;
}

/**
 * Smart back button that:
 * - Uses explicit `to` path when provided
 * - Falls back to internal navigation stack (anti-loop, deduplication)
 * - Falls back to "/" if stack is empty
 * - Shows contextual destination label
 * - Provides contextual aria-label with readable destination
 */
 export function BackButton({
   to,
   fallback = '/',
   label,
   variant = 'ghost',
   className,
   showLabelOnMobile = false,
 }: BackButtonProps) {
   const { goBack, goToIndex, previousPath, stack } = useNavigationStack();
   const navigate = useNavigate();
   const [showFullHistory, setShowFullHistory] = useState(false);
   const historyEntries = stack.slice(0, -1).map((path, index) => ({ path, index }))
     .filter(({ path }) => !path.startsWith('/auth')).reverse();
 
   const handleBack = () => {
     if (to) {
       const destination = safeNavigationPath(to);
       if (!destination) return goBack(fallback);
       if (!to.includes('?') && !to.includes('#') && previousPath
         && new URL(previousPath, window.location.origin).pathname === destination) {
         goBack(destination);
       } else {
         navigate(destination, { replace: true });
       }
     } else {
       goBack(fallback);
     }
   };

  // Resolve visible label: explicit > contextual destination > "Voltar"
  const destinationPath = to || previousPath || fallback;
  const contextualDestination = getReadableLabel(destinationPath);
  const displayLabel = label || contextualDestination;

  // Build accessible aria-label
  const ariaLabel = `Voltar para ${contextualDestination}`;

  const variantClasses = {
    default: 'text-muted-foreground hover:text-foreground',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    overlay: 'text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm',
  };

   return (
     <div className="flex items-center gap-0.5">
       <motion.div whileTap={{ scale: 0.95 }} className="inline-flex">
         <Button
           variant="ghost"
           size="sm"
           onClick={handleBack}
           className={cn(
             'gap-1.5 px-2.5 py-1.5 h-auto font-medium text-sm rounded-lg transition-colors',
             variantClasses[variant],
             className
           )}
           aria-label={ariaLabel}
         >
           <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
           <span className={cn(!showLabelOnMobile && 'hidden sm:inline')}>
             {displayLabel}
           </span>
         </Button>
       </motion.div>
 
       {historyEntries.length > 0 && (
         <DropdownMenu onOpenChange={(open) => { if (!open) setShowFullHistory(false); }}>
           <DropdownMenuTrigger asChild>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8 text-muted-foreground/70 hover:text-foreground rounded-lg"
               aria-label="Histórico de navegação"
             >
               <History className="h-3.5 w-3.5" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="start" className="w-56 p-1 max-h-80 overflow-y-auto">
             <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1.5">
               Histórico Recente
             </DropdownMenuLabel>
             <DropdownMenuSeparator />
             {historyEntries.slice(0, showFullHistory ? 20 : 5).map(({ path, index }) => (
               <DropdownMenuItem
                 key={`${path}-${index}`}
                 onClick={() => goToIndex(index)}
                 className="text-xs py-2 px-2 cursor-pointer gap-2"
               >
                 <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                 <span className="truncate flex-1">{getReadableLabel(path)}</span>
                 <span className="text-[10px] text-muted-foreground font-mono">
                   {path.split(/[?#]/)[0].length > 20 ? path.split(/[?#]/)[0].substring(0, 17) + '...' : path.split(/[?#]/)[0]}
                 </span>
               </DropdownMenuItem>
             ))}
             {historyEntries.length > 5 && !showFullHistory && (
               <>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem
                   onSelect={(event) => { event.preventDefault(); setShowFullHistory(true); }}
                   className="text-[10px] justify-center text-muted-foreground hover:text-primary transition-colors py-1"
                 >
                   Ver todo o rastro
                 </DropdownMenuItem>
               </>
             )}
           </DropdownMenuContent>
         </DropdownMenu>
       )}
     </div>
   );
}
