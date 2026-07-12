import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Activity, AlertTriangle, Mail, Mic, Sparkles,
  Shield, BookOpen, Map, FileText, Plug, Flag, Gauge, ThumbsUp,
} from 'lucide-react';

const ADMIN_LINKS: { to: string; label: string; icon: React.ElementType; exact?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/conexoes', label: 'Conexões', icon: Plug },
  { to: '/admin/telemetria', label: 'Telemetria', icon: Activity },
  { to: '/admin/error-budget', label: 'Error Budget', icon: Gauge },
  { to: '/admin/schema-drift', label: 'Schema Drift', icon: AlertTriangle },
  { to: '/admin/field-mapping', label: 'Field Mapping', icon: Map },
  { to: '/admin/email-diagnostics', label: 'Email Pipeline', icon: Mail },
  { to: '/admin/voice-diagnostics', label: 'Voice AI', icon: Mic },
  { to: '/admin/lux-config', label: 'Lux Intelligence', icon: Sparkles },
  { to: '/admin/secrets-management', label: 'Secrets', icon: Shield },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: Flag },
  { to: '/admin/audit-trail', label: 'Audit Trail', icon: FileText },
  { to: '/admin/insight-feedback', label: 'Feedback de Insights', icon: ThumbsUp },
  { to: '/admin/knowledge-export', label: 'Knowledge Export', icon: BookOpen },
  { to: '/admin/docs', label: 'Documentação', icon: BookOpen },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 shrink-0 border-r border-border/60 bg-card/50 min-h-[calc(100vh-4rem)] hidden lg:block">
      <div className="p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Administração
        </p>
        {ADMIN_LINKS.map(link => {
          const isActive = link.exact
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}

/** Mobile nav dropdown for admin */
export function AdminMobileNav() {
  const location = useLocation();

  return (
    <div className="lg:hidden border-b border-border/60 bg-card/50 px-4 py-2 overflow-x-auto">
      <div className="flex gap-1">
        {ADMIN_LINKS.map(link => {
          const isActive = link.exact
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
