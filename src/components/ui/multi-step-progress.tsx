import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MultiStepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function MultiStepProgress({ steps, currentStep, className }: MultiStepProgressProps) {
  return (
    <div className={cn("w-full space-y-2", className)} aria-label={`Progresso: Etapa ${currentStep + 1} de ${steps.length}`}>
      <div className="flex justify-between items-center mb-1">
        {steps.map((step, index) => (
          <div 
            key={step} 
            className={cn(
              "text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300",
              index <= currentStep ? "text-primary" : "text-muted-foreground/40"
            )}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="flex h-1.5 w-full gap-1.5 overflow-hidden rounded-full bg-muted/30">
        {steps.map((step, index) => (
          <div
            key={step}
            className="relative flex-1"
          >
            <div className="absolute inset-0 bg-muted/20" />
            {index <= currentStep && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "absolute h-full bg-primary",
                  index < currentStep ? "opacity-100" : "opacity-80"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}