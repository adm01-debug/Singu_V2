import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemStatusBadgeProps {
  className?: string;
}

export function SystemStatusBadge({ className }: SystemStatusBadgeProps) {
  return (
    <div className={cn("hidden lg:flex items-center gap-2", className)}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Sync Ativo</span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
      >
        <Zap className="w-2.5 h-2.5 text-primary" />
        <span className="text-[10px] font-medium text-primary uppercase tracking-tight">IA Neural</span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20"
      >
        <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-tight">Hardened</span>
      </motion.div>
    </div>
  );
}
