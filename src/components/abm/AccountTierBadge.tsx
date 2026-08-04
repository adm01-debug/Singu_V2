import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountTier } from "@/hooks/useABM";

const tierConfig: Record<AccountTier, { label: string; className: string }> = {
  strategic: { label: "Estratégica", className: "bg-primary/15 text-primary border-primary/30" },
  enterprise: { label: "Enterprise", className: "bg-accent/15 text-accent-foreground border-accent/30" },
  mid: { label: "Mid-Market", className: "bg-secondary text-secondary-foreground border-border" },
  smb: { label: "SMB", className: "bg-muted text-muted-foreground border-border" },
};

export function AccountTierBadge({ tier, className }: { tier: AccountTier; className?: string }) {
  const cfg = tierConfig[tier] ?? tierConfig.mid;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", cfg.className, className)}>
      {cfg.label}
    </Badge>
  );
}
