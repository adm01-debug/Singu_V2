import { ReactNode, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  gradientTone?: 'primary' | 'success' | 'warning' | 'premium';
  className?: string;
  delay?: number;
  animate?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  size?: 'sm' | 'default' | 'lg';
  sparkline?: number[];
  onClick?: () => void;
  emptyAction?: { label: string; href: string };
  subtitle?: string;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30, mass: 1 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => { motionValue.set(value); }, [value, motionValue]);
  useEffect(() => {
    const unsub = display.on('change', (v) => { if (ref.current) ref.current.textContent = v; });
    return unsub;
  }, [display]);

  return <span ref={ref} className={className}>0</span>;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 56;
  const h = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M${points.join(' L')}`;
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  
  return (
    <svg width={w} height={h} className="opacity-40 group-hover:opacity-70 transition-opacity" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.2" />
          <stop offset="100%" stopColor={`hsl(var(--${color}))`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color})`} />
      <path d={pathD} fill="none" stroke={`hsl(var(--${color}))`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const iconColorMap = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  premium: 'text-primary',
};

export function StatCard({
  title, value, change, changeType = 'neutral', icon: Icon,
  className, delay = 0, animate = true, sparkline, onClick, emptyAction,
  gradientTone = 'primary', subtitle,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/\D/g, ''));
  const isNumeric = typeof value === 'number' && !isNaN(numericValue);

  const ChangeIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;
  const sparkColor = gradientTone === 'success' ? 'success' : gradientTone === 'warning' ? 'warning' : 'primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delay * 0.04 }}
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border border-border bg-card p-5 transition-colors duration-200 hover:bg-muted/30 hover:border-border/80',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-end gap-2.5">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {isNumeric && animate ? <AnimatedNumber value={numericValue} /> : value}
            </p>
            {sparkline && sparkline.length > 1 && (
              <MiniSparkline data={sparkline} color={sparkColor} />
            )}
          </div>
          
          {change && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={cn(
                'flex items-center gap-1 text-[11px] font-medium',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground'
              )}>
                <ChangeIcon className="w-3 h-3" aria-hidden="true" />
                {change}
              </span>
            </div>
          )}
          
          {emptyAction && numericValue === 0 && (
            <Link 
              to={emptyAction.href}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline pt-0.5"
            >
              {emptyAction.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/70 pt-0.5">{subtitle}</p>
          )}
        </div>

        <div className={cn('p-2.5 rounded-lg bg-muted/50 shrink-0', iconColorMap[gradientTone])}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    </motion.div>
  );
}

// Compact stat for inline display
interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MiniStat({ label, value, icon: Icon, trend, className }: MiniStatProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Icon && (
        <div className="p-1.5 bg-muted/50 rounded-md">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {trend && (
          <span className={cn('text-xs', trend === 'up' && 'text-success', trend === 'down' && 'text-destructive')}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>;
}

export function HeroStat({ title, value, subtitle, icon: Icon, className }: {
  title: string; value: string | number; subtitle?: string; icon?: LucideIcon;
  gradient?: boolean; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('relative overflow-hidden rounded-xl p-6 text-center bg-card border border-border', className)}
    >
      {Icon && (
        <div className="inline-flex p-3 rounded-lg bg-muted/50 mb-3">
          <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>
      )}
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
