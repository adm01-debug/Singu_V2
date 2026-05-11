 import { memo } from 'react';
 import { Link } from 'react-router-dom';
 import { Users, User, ArrowRight } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
 import { RelationshipScore } from '@/components/ui/relationship-score';
 import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
 import type { Tables } from '@/integrations/supabase/types';
 import type { RelationshipStage } from '@/types';
 
 type Contact = Tables<'contacts'>;
 
 interface Props {
   contacts: Contact[];
   companyId: string;
 }
 
 export const RelatedContactsSection = memo(({ contacts, companyId }: Props) => {
   return (
     <Card>
       <CardHeader className="pb-3 border-b border-border/50">
         <div className="flex items-center justify-between">
           <CardTitle className="text-sm font-bold flex items-center gap-2">
             <Users className="h-4 w-4 text-primary" />
             Pessoas Relacionadas ({contacts.length})
           </CardTitle>
           <Link to={`/empresas/${companyId}?tab=contacts`} className="text-xs text-primary hover:underline flex items-center gap-1">
             Ver todos <ArrowRight className="h-3 w-3" />
           </Link>
         </div>
       </CardHeader>
       <CardContent className="pt-4 px-3">
         <div className="space-y-3">
           {contacts.slice(0, 5).map((contact) => (
             <Link
               key={contact.id}
               to={`/contatos/${contact.id}`}
               className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/40 group"
             >
               <OptimizedAvatar
                 src={contact.avatar_url || undefined}
                 alt={`${contact.first_name} ${contact.last_name}`}
                 fallback={contact.first_name?.[0] || '?'}
                 size="sm"
                 className="ring-1 ring-border group-hover:ring-primary/30"
               />
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-2">
                   <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                     {contact.first_name} {contact.last_name}
                   </p>
                   <RelationshipScore score={contact.relationship_score || 0} size="xs" />
                 </div>
                 <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[10px] text-muted-foreground truncate flex-1">
                     {contact.role_title || 'Contato'}
                   </span>
                   <RelationshipStageBadge stage={contact.relationship_stage as RelationshipStage || 'unknown'} size="xs" />
                 </div>
               </div>
             </Link>
           ))}
           {contacts.length === 0 && (
             <div className="py-6 text-center">
               <User className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
               <p className="text-xs text-muted-foreground italic">Nenhuma pessoa vinculada ainda.</p>
             </div>
           )}
         </div>
       </CardContent>
     </Card>
   );
 });
 RelatedContactsSection.displayName = 'RelatedContactsSection';