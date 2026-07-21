import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, Zap, Brain, Rocket, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  category: 'new' | 'improvement' | 'ai' | 'security';
  isHighlight?: boolean;
}

interface WhatsNewModalProps {
  version?: string;
  features?: Feature[];
  onClose?: () => void;
}

const WHATS_NEW_KEY = 'relateiq-whats-new-seen';
const CURRENT_VERSION = '2.0.0';

const defaultFeatures: Feature[] = [
  {
    id: '1',
    title: 'Busca Inteligente com Fuzzy Search',
    description: 'Encontre contatos mesmo com erros de digitação.',
    icon: Zap,
    category: 'improvement',
    isHighlight: true,
  },
  {
    id: '2',
    title: 'Análise de Inteligência Emocional',
    description: 'Identifique os 5 pilares de EQ de Daniel Goleman.',
    icon: Brain,
    category: 'ai',
    isHighlight: true,
  },
  {
    id: '3',
    title: 'Detecção de Vieses Cognitivos',
    description: 'Entenda padrões de pensamento dos seus contatos.',
    icon: Brain,
    category: 'ai',
  },
  {
    id: '4',
    title: 'Performance Otimizada',
    description: 'Listas virtualizadas para navegação suave.',
    icon: Rocket,
    category: 'improvement',
  },
  {
    id: '5',
    title: 'Modo Offline Aprimorado',
    description: 'Continue trabalhando sem conexão.',
    icon: Shield,
    category: 'security',
  },
  {
    id: '6',
    title: 'Ajuda Contextual',
    description: 'Tooltips em todas as métricas e funcionalidades.',
    icon: Sparkles,
    category: 'new',
  },
];

const categoryColors: Record<string, string> = {
  new: 'bg-primary/15 text-primary',
  improvement: 'bg-info/15 text-info',
  ai: 'bg-accent/15 text-accent-foreground',
  security: 'bg-success/15 text-success',
};

export function WhatsNewModal({
  version = CURRENT_VERSION,
  features = defaultFeatures,
  onClose,
}: WhatsNewModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(WHATS_NEW_KEY, version); } catch { /* private browsing */ }
    setIsVisible(false);
    return undefined;
  }, [version]);

  const handleDismiss = () => {
    try { localStorage.setItem(WHATS_NEW_KEY, version); } catch { /* private browsing */ }
    setIsVisible(false);
    onClose?.();
  };

  const highlightCount = features.filter(f => f.isHighlight).length;
  const totalCount = features.length;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-medium overflow-hidden">
            {/* Compact gradient header */}
            <div className="bg-gradient-primary px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">
                  Novidades v{version}
                </span>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px]">
                  {totalCount} updates
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleDismiss}
                aria-label="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Compact feature list — show highlights only */}
            <div className="px-4 py-3 space-y-2">
              {features.filter(f => f.isHighlight).slice(0, 3).map((feature) => (
                <div key={feature.id} className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', categoryColors[feature.category])}>
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{feature.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                  </div>
                </div>
              ))}
              {totalCount > highlightCount && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{totalCount - highlightCount} outras melhorias
                </p>
              )}
            </div>

            {/* Action */}
            <div className="px-4 pb-3">
              <Button 
                size="sm" 
                className="w-full gap-2 h-8 text-xs"
                onClick={handleDismiss}
              >
                Entendi
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWhatsNew() {
  const show = () => {
    localStorage.removeItem(WHATS_NEW_KEY);
    window.dispatchEvent(new CustomEvent('show-whats-new'));
  };
  return { show };
}

export default WhatsNewModal;