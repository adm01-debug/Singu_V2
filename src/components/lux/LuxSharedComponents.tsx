import { useState } from 'react';
import { motion } from 'framer-motion';
import {
   Globe, Linkedin, Instagram, Twitter, ExternalLink, Share2, UserPlus,
   Clock, AlertCircle, CheckCircle2, Loader2, Brain, Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LuxSocialProfile, LuxStakeholder } from '@/hooks/useLuxIntelligence';

export const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2; color: string }> = {
    pending: { label: 'Pendente', variant: 'outline', icon: Clock, color: 'text-muted-foreground' },
    processing: { label: 'Analisando...', variant: 'secondary', icon: Loader2, color: 'text-warning' },
    completed: { label: 'Concluído', variant: 'default', icon: CheckCircle2, color: 'text-success' },
    error: { label: 'Erro', variant: 'destructive', icon: AlertCircle, color: 'text-destructive' },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className={`gap-1.5 ${c.color}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {c.label}
    </Badge>
  );
};

export const DataCard = ({ title, icon: Icon, iconColor, children, className = '' }: {
  title: string;
  icon: typeof Brain;
  iconColor: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${iconColor}`}><Icon className="w-4 h-4" /></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.div>
);

export const SocialProfileCard = ({ profile }: { profile: LuxSocialProfile }) => {
  const platformIcons: Record<string, typeof Linkedin> = {
    linkedin: Linkedin, instagram: Instagram, twitter: Twitter, default: Globe,
  };
  const Icon = platformIcons[profile.platform?.toLowerCase() || 'default'] || platformIcons.default;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 transition-all">
      <div className="p-2 rounded-lg bg-background shadow-sm"><Icon className="w-4 h-4 text-primary" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.platform}</p>
        {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
      </div>
      <div className="flex items-center gap-2">
        {profile.followers && (
          <Badge variant="secondary" className="text-xs">
            {typeof profile.followers === 'number' ? profile.followers.toLocaleString('pt-BR') : profile.followers} seguidores
          </Badge>
        )}
        {profile.url && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={profile.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
          </Button>
        )}
      </div>
    </div>
  );
};

 export const StakeholderCard = ({ 
   stakeholder, 
   index, 
   onAddContact 
 }: { 
   stakeholder: LuxStakeholder; 
   index: number;
   onAddContact?: (s: LuxStakeholder) => Promise<void>;
 }) => {
   const [adding, setAdding] = useState(false);
   const [added, setAdded] = useState(false);
 
   const handleAdd = async () => {
     if (!onAddContact) return;
     setAdding(true);
     try {
       await onAddContact(stakeholder);
       setAdded(true);
     } finally {
       setAdding(false);
     }
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: index * 0.05 }}
       className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/50 to-secondary/50 dark:from-primary/20 dark:to-secondary/20 border border-primary/50 dark:border-primary/30"
     >
       <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
         {(stakeholder.first_name || stakeholder.name || '?').charAt(0)}
       </div>
       <div className="flex-1 min-w-0">
         <p className="text-sm font-medium truncate">
           {stakeholder.name || `${stakeholder.first_name || ''} ${stakeholder.last_name || ''}`.trim() || 'Nome não disponível'}
         </p>
         <p className="text-xs text-muted-foreground truncate">
           {stakeholder.role_title || stakeholder.position || 'Cargo não identificado'}
         </p>
       </div>
       <div className="flex items-center gap-1">
         {onAddContact && (
           <Button 
             variant="ghost" 
             size="icon" 
             className="h-7 w-7 text-primary" 
             onClick={handleAdd}
             disabled={adding || added}
           >
             {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : added ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
           </Button>
         )}
         {stakeholder.email && (
           <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
             <a href={`mailto:${stakeholder.email}`}><Share2 className="w-3.5 h-3.5" /></a>
           </Button>
         )}
         {stakeholder.linkedin && (
           <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
             <a href={stakeholder.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3.5 h-3.5" /></a>
           </Button>
         )}
       </div>
     </motion.div>
   );
 };
