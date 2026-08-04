import { cn } from '@/lib/utils';
import { ContactRole } from '@/types';

const roleConfig: Record<ContactRole, { label: string; className: string }> = {
  owner: { label: 'Proprietário', className: 'role-owner' },
  manager: { label: 'Gerente', className: 'role-manager' },
  buyer: { label: 'Comprador', className: 'role-buyer' },
  contact: { label: 'Contato', className: 'role-contact' },
  decision_maker: { label: 'Decisor', className: 'role-owner' },
  influencer: { label: 'Influenciador', className: 'role-manager' },
};

interface RoleBadgeProps {
  role: ContactRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  // Don't show badge for the default "contact" role — it's redundant
  if (role === 'contact') return null;
  
  const config = roleConfig[role];
  if (!config) return null;
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
