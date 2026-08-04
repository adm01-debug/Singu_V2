import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { DISCBadge } from '@/components/ui/disc-badge';
import type { Tables } from '@/integrations/supabase/types';
import type { DISCProfile, ContactRole, SentimentType, RelationshipStage } from '@/types';

type Contact = Tables<'contacts'>;

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

export function ContactsTabContent({ contacts }: { contacts: Contact[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((contact, index) => {
            const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
            return (
              <motion.div key={contact.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <Link to={`/contatos/${contact.id}`}>
                  <Card className="card-hover cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <OptimizedAvatar src={contact.avatar_url || undefined} alt={`${contact.first_name} ${contact.last_name}`} fallback={safeInitial(contact.first_name)} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{contact.first_name} {contact.last_name}</h3>
                            <RoleBadge role={contact.role as ContactRole || 'contact'} />
                            {behavior?.discProfile && <DISCBadge profile={behavior.discProfile} size="sm" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{contact.role_title || 'Sem cargo'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                            <SentimentIndicator sentiment={(contact.sentiment as SentimentType) || 'neutral'} />
                            <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                          </div>
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                            {contact.tags.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">Nenhum contato vinculado</h3>
            <p className="text-sm text-muted-foreground">Adicione contatos para esta empresa</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
