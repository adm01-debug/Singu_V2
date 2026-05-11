import { useState } from 'react';
 import { Users, Phone, Mail, Building2, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
 import { format } from 'date-fns';
 import { RelativeDialog } from './RelativeDialog';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  relatives: Tables<'contact_relatives'>[];
  contactId: string;
   onAdd: (data: any) => void;
   onUpdate: (id: string, updates: any) => void;
   onDelete: (id: string) => void;
}


 export function RelativesCard({ relatives, onAdd, onUpdate, onDelete }: Props) {
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="flex items-center justify-between text-sm font-medium">
           <div className="flex items-center gap-2">
             <Users className="h-4 w-4 text-warning" />
             Relacionados ({relatives.length})
           </div>
           <RelativeDialog 
             onSave={onAdd} 
             trigger={
               <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                 <Plus className="h-3 w-3 mr-1" />Adicionar
               </Button>
             } 
           />
         </CardTitle>
       </CardHeader>
      <CardContent className="space-y-2">
         {relatives.length > 0 ? relatives.map((rel) => (
           <div key={rel.id} className="rounded-lg border p-2.5 text-sm space-y-1 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{rel.name}</span>
                {rel.is_decision_influencer && (
                  <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Influenciador
                  </Badge>
                )}
              </div>
               <div className="flex items-center gap-1">
                 <Badge variant="secondary" className="text-[10px] capitalize">{rel.relationship_type}</Badge>
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <RelativeDialog 
                     onSave={(updates) => onUpdate(rel.id, updates)} 
                     initialData={rel}
                     trigger={
                       <button className="rounded p-0.5 text-muted-foreground hover:text-primary transition-colors">
                         <Edit2 className="h-3 w-3" />
                       </button>
                     }
                   />
                   <button
                     onClick={() => onDelete(rel.id)}
                     aria-label={`Remover ${rel.name}`}
                     className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                   >
                     <Trash2 className="h-3 w-3" />
                   </button>
                 </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {rel.age != null && <span>Idade: {rel.age}</span>}
              {rel.birthday && <span>Nasc: {format(new Date(rel.birthday), 'dd/MM/yyyy')}</span>}
              {rel.occupation && <span>Profissão: {rel.occupation}</span>}
              {rel.company && (
                <span className="flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5" />{rel.company}
                </span>
              )}
              {rel.phone && (
                <a href={`tel:${rel.phone}`} className="flex items-center gap-0.5 hover:text-primary">
                  <Phone className="h-2.5 w-2.5" />{rel.phone}
                </a>
              )}
              {rel.email && (
                <a href={`mailto:${rel.email}`} className="flex items-center gap-0.5 hover:text-primary truncate">
                  <Mail className="h-2.5 w-2.5" />{rel.email}
                </a>
              )}
            </div>
            {rel.notes && <p className="text-[10px] text-muted-foreground italic">{rel.notes}</p>}
          </div>
        )) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum relacionado registrado</p>
        )}
      </CardContent>
    </Card>
  );
}
