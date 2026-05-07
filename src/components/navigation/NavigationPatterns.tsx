import { useEffect, useRef, useState, KeyboardEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================
// BREADCRUMBS INTELIGENTES - Pilar 5.2
// ============================================

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: ReactNode;
  siblings?: Array<{ label: string; path: string }>;
}

interface EllipsisItem {
  label: string;
  path: string;
  isEllipsis: boolean;
}

type BreadcrumbDisplayItem = BreadcrumbItem | EllipsisItem;

function isBreadcrumbItem(item: BreadcrumbDisplayItem): item is BreadcrumbItem {
  return !('isEllipsis' in item);
}

interface SmartBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
}

export function SmartBreadcrumbs({ items, className, maxItems = 4 }: SmartBreadcrumbsProps) {
  const [isCollapsed, setIsCollapsed] = useState(items.length > maxItems);
  
  const visibleItems = isCollapsed 
    ? [items[0], { label: '...', path: '', isEllipsis: true }, ...items.slice(-2)]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <ol className="flex items-center gap-1">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isEllipsis = 'isEllipsis' in item && item.isEllipsis;
          
          if (isEllipsis) {
            return (
              <li key="ellipsis" className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1 text-muted-foreground hover:text-foreground"
                      aria-label="Ver itens ocultos"
                    >
                      ...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {items.slice(1, -2).map((hiddenItem) => (
                      <DropdownMenuItem key={hiddenItem.path} asChild>
                        <Link to={hiddenItem.path}>{hiddenItem.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" aria-hidden />
              </li>
            );
          }
          
          // Type guard to access BreadcrumbItem properties
          const breadcrumbItem = item as BreadcrumbItem;
          const hasSiblings = breadcrumbItem.siblings && breadcrumbItem.siblings.length > 0;
          
          return (
            <li key={item.path} className="flex items-center gap-1">
              {hasSiblings ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1",
                        isLast 
                          ? "text-foreground font-medium cursor-default" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {breadcrumbItem.icon}
                      <span>{item.label}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {breadcrumbItem.siblings?.map((sibling) => (
                      <DropdownMenuItem key={sibling.path} asChild>
                        <Link to={sibling.path}>{sibling.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isLast ? (
                <span 
                  className="flex items-center gap-1.5 px-2 py-1 text-foreground font-medium"
                  aria-current="page"
                >
                  {breadcrumbItem.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  {breadcrumbItem.icon}
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================
// TABS COM ANIMAÇÃO - Pilar 5.4
// ============================================

interface TabItem {
  id: string;
  label: string;
  count?: number;
  hasUpdates?: boolean;
  disabled?: boolean;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'boxed';
}

export function AnimatedTabs({ tabs, activeTab, onChange, className, variant = 'underline' }: AnimatedTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  useEffect(() => {
    const activeTabElement = tabRefs.current.get(activeTab);
    if (activeTabElement) {
      setIndicatorStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      });
    }
  }, [activeTab]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledTabs = tabs.filter(t => !t.disabled);
    const currentEnabledIndex = enabledTabs.findIndex(t => t.id === tabs[currentIndex].id);
    
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentEnabledIndex + 1) % enabledTabs.length;
      onChange(enabledTabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
      onChange(enabledTabs[prevIndex].id);
    }
  };

  const variantClasses = {
    underline: {
      container: "border-b border-border",
      tab: "px-4 py-3 relative",
      tabActive: "text-foreground",
      tabInactive: "text-muted-foreground hover:text-foreground",
      indicator: "absolute bottom-0 h-0.5 bg-primary rounded-full"
    },
    pills: {
      container: "bg-muted/50 p-1 rounded-lg",
      tab: "px-4 py-2 rounded-md relative",
      tabActive: "text-foreground",
      tabInactive: "text-muted-foreground hover:text-foreground",
      indicator: "absolute inset-0 bg-background shadow-sm rounded-md -z-10"
    },
    boxed: {
      container: "border border-border rounded-lg p-1",
      tab: "px-4 py-2 rounded-md relative",
      tabActive: "text-primary-foreground",
      tabInactive: "text-muted-foreground hover:text-foreground",
      indicator: "absolute inset-0 bg-primary rounded-md -z-10"
    }
  };

  const styles = variantClasses[variant];

  return (
    <div 
      className={cn("relative", styles.container, className)}
      role="tablist"
      aria-orientation="horizontal"
    >
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "relative whitespace-nowrap font-medium text-sm transition-colors",
                styles.tab,
                isActive ? styles.tabActive : styles.tabInactive,
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full",
                    isActive ? "bg-primary/20" : "bg-muted"
                  )}>
                    {tab.count}
                  </span>
                )}
                {tab.hasUpdates && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Animated Indicator */}
      <motion.div
        className={styles.indicator}
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  );
}

// ============================================
// SKIP LINK - Acessibilidade
// ============================================

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-content"
    >
      Pular para o conteúdo principal
    </a>
  );
}

// useReducedMotion is now imported from @/hooks/useReducedMotion

// Motion wrapper that respects reduced motion
interface MotionWrapperProps {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'scaleIn';
  delay?: number;
  className?: string;
}

export function AccessibleMotion({ children, animation = 'fadeIn', delay = 0, className }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slideUp: {
      initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      animate: { opacity: 1, y: 0 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      transition={{ 
        duration: prefersReducedMotion ? 0.01 : 0.3,
        delay: prefersReducedMotion ? 0 : delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// ARIA LIVE REGION - Pilar 7.3
// ============================================

interface LiveRegionProps {
  message: string;
  type?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ message, type = 'polite', className }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}

// ============================================
// FOCUS TRAP - para modais/dialogs
// ============================================

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element
    firstElement?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
