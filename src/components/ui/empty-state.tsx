import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'secondary';
}

interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: 'contacts' | 'companies' | 'interactions' | 'search' | 'calendar' | 'insights';
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  tips?: string[];
  children?: ReactNode;
}

const illustrations = {
  contacts: (
    <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* People illustration */}
      <circle cx="100" cy="140" rx="80" ry="15" className="fill-muted/30" />
      {/* Main person */}
      <circle cx="100" cy="50" r="28" className="fill-primary/20 stroke-primary" strokeWidth="2" />
      <circle cx="92" cy="45" r="3" className="fill-primary" />
      <circle cx="108" cy="45" r="3" className="fill-primary" />
      <path d="M92 58 Q100 64 108 58" className="stroke-primary" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M70 130 Q70 85 100 85 Q130 85 130 130" className="fill-primary/10 stroke-primary" strokeWidth="2" />
      {/* Left person (smaller) */}
      <circle cx="45" cy="70" r="18" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      <circle cx="40" cy="67" r="2" className="fill-muted-foreground/40" />
      <circle cx="50" cy="67" r="2" className="fill-muted-foreground/40" />
      <path d="M30 130 Q30 100 45 100 Q60 100 60 130" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      {/* Right person (smaller) */}
      <circle cx="155" cy="70" r="18" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      <circle cx="150" cy="67" r="2" className="fill-muted-foreground/40" />
      <circle cx="160" cy="67" r="2" className="fill-muted-foreground/40" />
      <path d="M140 130 Q140 100 155 100 Q170 100 170 130" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      {/* Connection lines */}
      <path d="M65 75 L78 70" className="stroke-primary/40" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M135 75 L122 70" className="stroke-primary/40" strokeWidth="2" strokeDasharray="4 4" />
      {/* Plus icons */}
      <circle cx="168" cy="35" r="12" className="fill-primary stroke-primary" strokeWidth="2" />
      <path d="M168 29 L168 41 M162 35 L174 35" className="stroke-white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  companies: (
    <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground */}
      <ellipse cx="100" cy="145" rx="85" ry="12" className="fill-muted/30" />
      {/* Main building */}
      <rect x="70" y="40" width="60" height="100" rx="4" className="fill-primary/10 stroke-primary" strokeWidth="2" />
      <rect x="80" y="50" width="12" height="16" rx="2" className="fill-primary/30" />
      <rect x="100" y="50" width="12" height="16" rx="2" className="fill-primary/30" />
      <rect x="80" y="75" width="12" height="16" rx="2" className="fill-primary/30" />
      <rect x="100" y="75" width="12" height="16" rx="2" className="fill-primary/30" />
      <rect x="80" y="100" width="12" height="16" rx="2" className="fill-primary/30" />
      <rect x="100" y="100" width="12" height="16" rx="2" className="fill-primary/30" />
      {/* Door */}
      <rect x="92" y="120" width="16" height="20" rx="2" className="fill-primary/50" />
      {/* Left building (smaller) */}
      <rect x="25" y="75" width="35" height="65" rx="3" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      <rect x="32" y="82" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="45" y="82" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="32" y="100" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="45" y="100" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="38" y="125" width="10" height="15" rx="1" className="fill-muted-foreground/30" />
      {/* Right building (smaller) */}
      <rect x="140" y="65" width="35" height="75" rx="3" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      <rect x="147" y="72" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="160" y="72" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="147" y="90" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="160" y="90" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="147" y="108" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="160" y="108" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
      <rect x="153" y="125" width="10" height="15" rx="1" className="fill-muted-foreground/30" />
      {/* Plus icon */}
      <circle cx="170" cy="25" r="12" className="fill-primary stroke-primary" strokeWidth="2" />
      <path d="M170 19 L170 31 M164 25 L176 25" className="stroke-white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  interactions: (
    <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chat bubbles */}
      <rect x="30" y="30" width="80" height="50" rx="12" className="fill-primary/10 stroke-primary" strokeWidth="2" />
      <circle cx="55" cy="55" r="4" className="fill-primary/40" />
      <circle cx="70" cy="55" r="4" className="fill-primary/40" />
      <circle cx="85" cy="55" r="4" className="fill-primary/40" />
      <polygon points="45,80 45,95 60,80" className="fill-primary/10 stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      
      <rect x="90" y="85" width="80" height="50" rx="12" className="fill-muted stroke-muted-foreground/40" strokeWidth="2" />
      <line x1="105" y1="100" x2="155" y2="100" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
      <line x1="105" y1="112" x2="145" y2="112" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
      <line x1="105" y1="124" x2="125" y2="124" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
      <polygon points="155,135 155,150 140,135" className="fill-muted stroke-muted-foreground/40" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Connection arrow */}
      <path d="M115 65 C 140 65, 85 85, 115 85" className="stroke-primary/50" strokeWidth="2" strokeDasharray="5 5" fill="none" />
      
      {/* Icons decorations */}
      <circle cx="20" cy="110" r="8" className="fill-success/20" />
      <circle cx="180" cy="50" r="8" className="fill-info/20" />
      
      {/* Plus icon */}
      <circle cx="175" cy="20" r="12" className="fill-primary stroke-primary" strokeWidth="2" />
      <path d="M175 14 L175 26 M169 20 L181 20" className="stroke-white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="90" cy="70" r="40" className="fill-muted/30 stroke-primary" strokeWidth="3" />
      <circle cx="90" cy="70" r="28" className="stroke-primary/50" strokeWidth="2" strokeDasharray="6 4" fill="none" />
      <line x1="120" y1="100" x2="155" y2="135" className="stroke-primary" strokeWidth="8" strokeLinecap="round" />
      <line x1="120" y1="100" x2="150" y2="130" className="stroke-primary/30" strokeWidth="14" strokeLinecap="round" />
      
      {/* No results indicator */}
      <circle cx="80" cy="65" r="5" className="fill-muted-foreground/40" />
      <circle cx="100" cy="65" r="5" className="fill-muted-foreground/40" />
      <path d="M78 82 Q90 75 102 82" className="stroke-muted-foreground/40" strokeWidth="3" fill="none" strokeLinecap="round" />
      
      {/* Floating elements */}
      <rect x="20" y="40" width="20" height="4" rx="2" className="fill-muted-foreground/20" />
      <rect x="20" y="50" width="14" height="4" rx="2" className="fill-muted-foreground/20" />
      <rect x="160" y="60" width="20" height="4" rx="2" className="fill-muted-foreground/20" />
      <rect x="165" y="70" width="14" height="4" rx="2" className="fill-muted-foreground/20" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar body */}
      <rect x="35" y="35" width="130" height="110" rx="8" className="fill-card stroke-primary" strokeWidth="2" />
      <rect x="35" y="35" width="130" height="28" rx="8" className="fill-primary/20" />
      <rect x="35" y="55" width="130" height="8" className="fill-primary/20" />
      
      {/* Calendar rings */}
      <rect x="60" y="28" width="8" height="20" rx="2" className="fill-primary" />
      <rect x="90" y="28" width="8" height="20" rx="2" className="fill-primary" />
      <rect x="120" y="28" width="8" height="20" rx="2" className="fill-primary" />
      
      {/* Calendar grid */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={45 + col * 17}
            y={72 + row * 14}
            width="12"
            height="10"
            rx="2"
            className={row === 1 && col === 3 ? 'fill-primary/30' : 'fill-muted/50'}
          />
        ))
      )}
      
      {/* Clock decoration */}
      <circle cx="160" cy="25" r="15" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
      <line x1="160" y1="25" x2="160" y2="16" className="stroke-muted-foreground/50" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="25" x2="167" y2="28" className="stroke-muted-foreground/50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Light bulb */}
      <ellipse cx="100" cy="145" rx="35" ry="8" className="fill-muted/30" />
      <path d="M70 70 Q70 30 100 30 Q130 30 130 70 Q130 90 115 100 L115 115 L85 115 L85 100 Q70 90 70 70" className="fill-warning/20 stroke-warning" strokeWidth="2" />
      <rect x="82" y="115" width="36" height="15" rx="3" className="fill-muted stroke-muted-foreground/40" strokeWidth="1.5" />
      <line x1="85" y1="122" x2="115" y2="122" className="stroke-muted-foreground/30" strokeWidth="2" />
      <line x1="85" y1="127" x2="115" y2="127" className="stroke-muted-foreground/30" strokeWidth="2" />
      <path d="M90 130 L95 140 L105 140 L110 130" className="fill-muted stroke-muted-foreground/40" strokeWidth="1.5" />
      
      {/* Glow effect */}
      <circle cx="100" cy="60" r="45" className="fill-warning/5" />
      
      {/* Sparkles */}
      <path d="M55 45 L60 50 L55 55 L50 50 Z" className="fill-warning/60" />
      <path d="M145 45 L150 50 L145 55 L140 50 Z" className="fill-warning/60" />
      <path d="M40 80 L44 84 L40 88 L36 84 Z" className="fill-warning/40" />
      <path d="M160 80 L164 84 L160 88 L156 84 Z" className="fill-warning/40" />
      <circle cx="65" cy="25" r="3" className="fill-warning/40" />
      <circle cx="135" cy="25" r="3" className="fill-warning/40" />
      
      {/* Data visualization hint */}
      <rect x="15" y="100" width="30" height="4" rx="2" className="fill-primary/30" />
      <rect x="15" y="110" width="22" height="4" rx="2" className="fill-primary/20" />
      <rect x="155" y="100" width="30" height="4" rx="2" className="fill-primary/30" />
      <rect x="163" y="110" width="22" height="4" rx="2" className="fill-primary/20" />
    </svg>
  ),
};

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  actions = [],
  tips = [],
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      {/* Illustration or Icon */}
      <div className="mb-6">
        {illustration ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {illustrations[illustration]}
          </motion.div>
        ) : Icon ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <Icon className="w-10 h-10 text-muted-foreground" />
          </motion.div>
        ) : null}
      </div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2 text-center"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-md mb-6"
      >
        {description}
      </motion.p>

      {/* Tips */}
      {tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/30 rounded-lg p-4 mb-6 max-w-md w-full"
        >
          <p className="text-sm font-medium text-foreground mb-2"><span role="img" aria-hidden="true">💡</span> Dicas para começar:</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || (index === 0 ? 'default' : 'outline')}
              onClick={action.onClick}
              className={index === 0 ? 'gap-2' : ''}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          ))}
        </motion.div>
      )}

      {/* Custom children */}
      {children}
    </motion.div>
  );
}

/** Compact inline empty state for use inside cards */
export function InlineEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
      <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2.5">
        <Icon className="h-5 w-5 text-muted-foreground/70" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-0.5 max-w-[220px]">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 h-7 text-xs px-3"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function SearchEmptyState({
  searchTerm,
  onClearSearch,
  entityName = 'itens',
}: {
  searchTerm: string;
  onClearSearch: () => void;
  entityName?: string;
}) {
  return (
    <EmptyState
      illustration="search"
      title={`Nenhum resultado para "${searchTerm}"`}
      description={`Não encontramos ${entityName} que correspondam à sua busca. Tente usar termos diferentes ou remover alguns filtros.`}
      actions={[
        {
          label: 'Limpar busca',
          onClick: onClearSearch,
          variant: 'outline',
        },
      ]}
      tips={[
        'Verifique se as palavras estão escritas corretamente',
        'Tente usar termos mais genéricos',
        'Remova alguns filtros ativos',
      ]}
    />
  );
}
