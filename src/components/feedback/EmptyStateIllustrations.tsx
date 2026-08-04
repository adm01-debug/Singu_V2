import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
}

export function ContactsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={cn('w-full h-full', className)}>
      <circle cx="100" cy="100" r="80" fill="currentColor" className="text-muted/20" />
      <circle cx="100" cy="70" r="20" fill="currentColor" className="text-muted-foreground/30" />
      <path d="M60 130 C60 105, 140 105, 140 130" fill="currentColor" className="text-muted-foreground/30" />
      <circle cx="140" cy="140" r="20" fill="currentColor" className="text-primary/20" />
      <path d="M140 130 L140 150 M130 140 L150 140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary" />
    </svg>
  );
}

export function SearchIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={cn('w-full h-full', className)}>
      <circle cx="85" cy="85" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted-foreground/30" />
      <line x1="115" y1="115" x2="155" y2="155" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="text-muted-foreground/30" />
      <text x="85" y="95" textAnchor="middle" fontSize="40" fill="currentColor" className="text-muted-foreground/70">?</text>
    </svg>
  );
}

export function CompaniesIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={cn('w-full h-full', className)}>
      <rect x="60" y="50" width="80" height="110" rx="4" fill="currentColor" className="text-muted-foreground/20" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2].map((col) => (
          <rect key={`${row}-${col}`} x={70 + col * 24} y={60 + row * 24} width="14" height="14" rx="2" fill="currentColor" className="text-primary/30" />
        ))
      )}
      <rect x="88" y="140" width="24" height="20" rx="2" fill="currentColor" className="text-muted-foreground/40" />
    </svg>
  );
}

export function InteractionsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={cn('w-full h-full', className)}>
      <rect x="30" y="50" width="70" height="40" rx="8" fill="currentColor" className="text-primary/20" />
      <polygon points="45,90 55,90 50,100" fill="currentColor" className="text-primary/20" />
      <rect x="100" y="100" width="70" height="40" rx="8" fill="currentColor" className="text-muted-foreground/20" />
      <polygon points="145,140 155,140 150,150" fill="currentColor" className="text-muted-foreground/20" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={55 + i * 12} cy={70} r="4" fill="currentColor" className="text-primary/50" />
      ))}
    </svg>
  );
}

export function AnalyticsIllustration({ className }: IllustrationProps) {
  const heights = [60, 100, 80, 120, 90];
  return (
    <svg viewBox="0 0 200 200" className={cn('w-full h-full', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={35 + i * 30} y={160 - heights[i]} width="20" height={heights[i]} rx="4" fill="currentColor" className={i % 2 === 0 ? 'text-primary/30' : 'text-muted-foreground/20'} />
      ))}
      <path d="M35 130 L65 90 L95 110 L125 50 L155 70" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
    </svg>
  );
}

export function NoDataIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={cn('w-full h-full', className)}>
      <path d="M60 40 L120 40 L140 60 L140 160 L60 160 Z" fill="currentColor" className="text-muted/30" />
      <path d="M120 40 L120 60 L140 60" fill="currentColor" className="text-muted-foreground/20" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="75" y={80 + i * 25} width={i === 1 ? 40 : 50} height="8" rx="2" fill="currentColor" className="text-muted-foreground/20" />
      ))}
    </svg>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const Illustrations = {
  Contacts: ContactsIllustration,
  Search: SearchIllustration,
  Companies: CompaniesIllustration,
  Interactions: InteractionsIllustration,
  Analytics: AnalyticsIllustration,
  NoData: NoDataIllustration,
};
