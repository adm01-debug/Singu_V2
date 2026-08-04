import { useLocation, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  ChevronRight, 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3, 
  Lightbulb, 
  Settings,
  Calendar,
  Bell,
  Network
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BreadcrumbData {
  contact?: { first_name: string; last_name: string };
  company?: { name: string };
}

interface RouteConfig {
  label: string | ((params: { id?: string }, data?: BreadcrumbData) => string);
  icon: React.ComponentType<{ className?: string }>;
  parent?: string;
}

const routeConfig: Record<string, RouteConfig> = {
  '/': { label: 'Dashboard', icon: Home },
  '/contatos': { label: 'Contatos', icon: Users },
  '/empresas': { label: 'Empresas', icon: Building2 },
  '/interacoes': { label: 'Interações', icon: MessageSquare },
  '/analytics': { label: 'Analytics', icon: BarChart3 },
  '/insights': { label: 'Insights', icon: Lightbulb },
  '/configuracoes': { label: 'Configurações', icon: Settings },
  '/calendario': { label: 'Calendário', icon: Calendar },
  '/notificacoes': { label: 'Notificações', icon: Bell },
  '/network': { label: 'Network', icon: Network },
};

interface SmartBreadcrumbsProps {
  data?: BreadcrumbData;
  className?: string;
}

export function SmartBreadcrumbs({ data, className }: SmartBreadcrumbsProps) {
  const location = useLocation();
  
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs: Array<{ path: string; label: string; icon?: React.ComponentType<{ className?: string }> }> = [
      { path: '/', label: 'Início', icon: Home }
    ];
    
    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      
      // Check if this is a detail page (has an ID)
      const isDetailPage = i > 0 && pathSegments[i - 1] && 
        (pathSegments[i - 1] === 'contatos' || pathSegments[i - 1] === 'empresas');
      
      if (isDetailPage) {
        // Get entity name from data
        if (pathSegments[i - 1] === 'contatos' && data?.contact) {
          crumbs.push({
            path: currentPath,
            label: `${data.contact.first_name} ${data.contact.last_name}`,
            icon: Users,
          });
        } else if (pathSegments[i - 1] === 'empresas' && data?.company) {
          crumbs.push({
            path: currentPath,
            label: data.company.name,
            icon: Building2,
          });
        } else {
          crumbs.push({
            path: currentPath,
            label: 'Detalhes',
          });
        }
      } else {
        // Regular route
        const config = routeConfig[currentPath];
        if (config) {
          const label = typeof config.label === 'function' 
            ? config.label({ id: segment }, data)
            : config.label;
            
          crumbs.push({ 
            path: currentPath, 
            label,
            icon: config.icon,
          });
        }
      }
    }
    
    return crumbs;
  }, [location.pathname, data]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center gap-1 text-sm overflow-x-auto", className)}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = crumb.icon;
        
        return (
          <motion.div 
            key={crumb.path} 
            className="flex items-center shrink-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground shrink-0" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground flex items-center gap-1.5 whitespace-nowrap">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <span className="truncate max-w-[150px]">{crumb.label}</span>
              </span>
            ) : (
              <Link 
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 whitespace-nowrap group"
              >
                {Icon && <Icon className="w-4 h-4 group-hover:text-primary transition-colors" />}
                <span className="truncate max-w-[100px]">{crumb.label}</span>
              </Link>
            )}
          </motion.div>
        );
      })}
    </nav>
  );
}

export default SmartBreadcrumbs;
