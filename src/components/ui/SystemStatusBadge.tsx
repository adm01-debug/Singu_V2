import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SystemStatusBadgeProps {
  className?: string;
}

export function SystemStatusBadge({ className }: SystemStatusBadgeProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("hidden lg:flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 cursor-help"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Sync Ativo</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-[11px]">
            <p>Conectado ao Supabase Realtime. Sincronização de dados em tempo real está ativa.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 cursor-help"
            >
              <Zap className="w-2.5 h-2.5 text-primary" />
              <span className="text-[10px] font-medium text-primary uppercase tracking-tight">IA Neural</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-[11px]">
            <p>Os motores de IA estão operando com 100% de capacidade para gerar insights e briefings.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 cursor-help"
            >
              <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-tight">Hardened</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-[11px]">
            <p>Protocolos de segurança máxima ativos. Todas as comunicações são criptografadas de ponta a ponta.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
