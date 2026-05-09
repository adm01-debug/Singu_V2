import { Users, Building2, Cake, Phone, Mail, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { InlineEdit } from '@/components/inline-edit/InlineEdit';
import { Button } from '@/components/ui/button';
import { useRelativeMutations } from '@/hooks/useContactRelationalData';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface RelativesSectionProps {
  contactId: string;
  relatives: Tables<'contact_relatives'>[];
}

export function RelativesSection({ contactId, relatives }: RelativesSectionProps) {
  const { addRelative, updateRelative, deleteRelative } = useRelativeMutations(contactId);

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      await updateRelative.mutateAsync({ id, updates: { [field]: value } });
      return true;
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    addRelative.mutate({
      name: 'Novo Familiar',
      relationship_type: 'other',
    });
  };

  return (
    <CollapsibleSection
      title="Relacionados"
      icon={Users}
      iconColor="text-secondary"
      badge={relatives.length}
      defaultOpen={relatives.length > 0}
      headerAction={
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleAdd(); }}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      }
    >
      {relatives.length > 0 ? (
        <div className="space-y-2">
          {relatives.map((rel) => (
            <div key={rel.id} className="rounded-lg border p-2.5 text-sm space-y-1 relative group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <InlineEdit
                    value={rel.name}
                    onSave={(v) => handleUpdate(rel.id, 'name', v)}
                    className="font-medium text-foreground"
                    displayClassName="py-0 px-0 -mx-0 hover:bg-transparent"
                  />
                  <InlineEdit
                    value={rel.relationship_type}
                    onSave={(v) => handleUpdate(rel.id, 'relationship_type', v)}
                    className="text-xs text-muted-foreground capitalize"
                    displayClassName="py-0 px-0 -mx-0 hover:bg-transparent"
                  />
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  <InlineEdit
                    value={rel.occupation || ''}
                    onSave={(v) => handleUpdate(rel.id, 'occupation', v)}
                    placeholder="Profissão"
                    emptyText="Profissão"
                    displayClassName="py-0 px-0 -mx-0 hover:bg-transparent justify-end"
                  />
                  {rel.company ? (
                    <span className="flex items-center gap-1 justify-end">
                      <Building2 className="h-3 w-3" />
                      <InlineEdit
                        value={rel.company}
                        onSave={(v) => handleUpdate(rel.id, 'company', v)}
                        displayClassName="py-0 px-0 -mx-0 hover:bg-transparent"
                      />
                    </span>
                  ) : (
                    <InlineEdit
                      value=""
                      onSave={(v) => handleUpdate(rel.id, 'company', v)}
                      placeholder="Empresa"
                      emptyText="Empresa"
                      displayClassName="py-0 px-0 -mx-0 hover:bg-transparent justify-end"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <InlineEdit
                    value={String(rel.age || '')}
                    onSave={(v) => handleUpdate(rel.id, 'age', parseInt(v) || null)}
                    placeholder="Idade"
                    emptyText="Idade"
                    displayClassName="py-0 px-0 -mx-0 hover:bg-transparent"
                  />
                  {rel.age && <span>anos</span>}
                </div>
                {rel.birthday && (
                  <span className="flex items-center gap-0.5">
                    <Cake className="h-3 w-3" />
                    {format(new Date(rel.birthday), "dd/MM")}
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  <Phone className="h-3 w-3" />
                  <InlineEdit
                    value={rel.phone || ''}
                    onSave={(v) => handleUpdate(rel.id, 'phone', v)}
                    placeholder="Telefone"
                    emptyText="Telefone"
                    displayClassName="py-0 px-0 -mx-0 hover:bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-0.5">
                  <Mail className="h-3 w-3" />
                  <InlineEdit
                    value={rel.email || ''}
                    onSave={(v) => handleUpdate(rel.id, 'email', v)}
                    placeholder="Email"
                    emptyText="Email"
                    className="max-w-[150px]"
                    displayClassName="py-0 px-0 -mx-0 hover:bg-transparent truncate"
                  />
                </div>
              </div>
              <InlineEdit
                value={rel.notes || ''}
                onSave={(v) => handleUpdate(rel.id, 'notes', v)}
                placeholder="Notas"
                emptyText="Adicionar notas..."
                multiline
                className="text-xs text-muted-foreground italic"
                displayClassName="py-0 px-0 -mx-0 hover:bg-transparent"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteRelative.mutate(rel.id)}
              >
                <Plus className="h-3 w-3 rotate-45" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <InlineEmptyState icon={Users} title="Nenhum relacionado" description="Adicione familiares ou contatos próximos" />
      )}
    </CollapsibleSection>
  );
}
