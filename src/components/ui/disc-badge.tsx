import { cn } from '@/lib/utils';
import { DISCProfile, DISC_LABELS } from '@/types';
import { motion } from 'framer-motion';

interface DISCBadgeProps {
  profile: DISCProfile;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function DISCBadge({ profile, confidence, size = 'md', showLabel = true, className }: DISCBadgeProps) {
  if (!profile) {
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border',
        className
      )}>
        Não definido
      </span>
    );
  }
  const config = DISC_LABELS[profile];
  
  // Safety check: if profile is not a valid DISC type, show fallback
  if (!config) {
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border',
        className
      )}>
        {profile || 'Não definido'}
      </span>
    );
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center rounded-full font-semibold border',
          config.color,
          sizeClasses[size]
        )}
      >
        <span className="mr-1.5 font-bold">{profile}</span>
        {showLabel && <span className="font-medium">{config.name}</span>}
      </span>
      {confidence !== undefined && confidence > 0 && (
        <span className="text-xs text-muted-foreground">
          {confidence}% confiança
        </span>
      )}
    </div>
  );
}

interface DISCSelectorProps {
  value: DISCProfile;
  onChange: (value: DISCProfile) => void;
  className?: string;
}

export function DISCSelector({ value, onChange, className }: DISCSelectorProps) {
  const profiles: DISCProfile[] = ['D', 'I', 'S', 'C'];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {profiles.map((profile) => {
        const config = DISC_LABELS[profile];
        const isSelected = value === profile;

        return (
          <motion.button
            key={profile}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(isSelected ? null : profile)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              isSelected
                ? cn(config.color, 'border-current shadow-md')
                : 'border-border bg-card hover:border-muted-foreground/30'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg',
                isSelected ? 'bg-foreground/20' : 'bg-muted'
              )}>
                {profile}
              </span>
              <span className="font-semibold">{config.name}</span>
            </div>
            <p className={cn(
              'text-sm',
              isSelected ? 'opacity-90' : 'text-muted-foreground'
            )}>
              {config.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

interface DISCChartProps {
  profile: DISCProfile;
  className?: string;
}

export function DISCChart({ profile, className }: DISCChartProps) {
  const profiles: DISCProfile[] = ['D', 'I', 'S', 'C'];
  
  // Simulate scores based on primary profile
  const getScore = (p: DISCProfile): number => {
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    if (p === profile) return 85 + Math.random() * 15;
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    return 20 + Math.random() * 40;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {profiles.map((p) => {
        const config = DISC_LABELS[p];
        const score = profile ? getScore(p) : 25;
        const isPrimary = p === profile;

        return (
          <div key={p} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={cn('font-medium', isPrimary && 'text-foreground')}>
                {config.name}
              </span>
              <span className="text-muted-foreground">{Math.round(score)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  isPrimary ? config.color.split(' ')[0].replace('bg-', 'bg-') : 'bg-muted-foreground/30'
                )}
                style={{
                  backgroundColor: isPrimary 
                    ? p === 'D' ? '#ef4444' 
                    : p === 'I' ? '#eab308' 
                    : p === 'S' ? '#22c55e' 
                    : '#3b82f6'
                    : undefined
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
