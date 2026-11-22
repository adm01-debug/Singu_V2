import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowRight, Star, Trash2 } from 'lucide-react';
import { queryExternalData } from '@/lib/externalData';
import {
  useEntityRelationships,
  useDeleteEntityRelationship,
  ROLE_LABELS,
  type EntityRelationship,
  type EntityType,
} from '@/hooks/useEntityRelationships';

const TYPE_LABEL: Record<EntityType, string> = { company: 'Empresa', contact: 'Pessoa' };

function useEntityLabels(ids: { company: string[]; contact: string[] }) {
  const companyKey = ids.company.slice().sort().join(',');
  const contactKey = ids.contact.slice().sort().join(',');
  return useQuery({
    queryKey: ['relationship-labels', companyKey, contactKey],
    enabled: ids.company.length > 0 || ids.contact.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const map = new Map<string, string>();
      if (ids.company.length > 0) {
        const { data } = await queryExternalData<Record<string, unknown>>({
          table: 'companies',
          select: 'id, nome_crm, nome_fantasia',
          filters: [{ type: 'in', column: 'id', value: ids.company }],
          range: { from: 0, to: ids.company.length - 1 },
        });
        (data ?? []).forEach(r => map.set(String(r.id), String(r.nome_crm || r.nome_fantasia || 'Sem nome')));
      }
      if (ids.contact.length > 0) {
        const { data } = await queryExternalData<Record<string, unknown>>({
          table: 'contacts',
          select: 'id, first_name, last_name, email',
          filters: [{ type: 'in', column: 'id', value: ids.contact }],
          range: { from: 0, to: ids.contact.length - 1 },
        });
        (data ?? []).forEach(r =>
          map.set(String(r.id), `${String(r.first_name || '')} ${String(r.last_name || '')}`.trim() || String(r.email || 'Sem nome'))
        );
      }
      return map;
    },
  });
}

function labelFor(type: EntityType, id: string, labels?: Map<string, string>) {
  return labels?.get(id) ?? `${TYPE_LABEL[type]} ${id.slice(0, 8)}`;
}

export function RelationshipList() {
  const { data: relationships, isLoading } = useEntityRelationships();
  const del = useDeleteEntityRelationship();
  const [pending, setPending] = useState<EntityRelationship | null>(null);

  const ids = useMemo(() => {
    const company: string[] = [];
    const contact: string[] = [];
    (relationships ?? []).forEach(r => {
      (r.from_type === 'company' ? company : contact).push(r.from_id);
      (r.to_type === 'company' ? company : contact).push(r.to_id);
    });
    return { company: [...new Set(company)], contact: [...new Set(contact)] };
  }, [relationships]);

  const { data: labels } = useEntityLabels(ids);

  if (isLoading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  const rows = relationships ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nenhum vínculo criado ainda.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border/60">
        {rows.map(r => (
          <li key={r.id} className="flex items-center gap-2 py-2 text-sm">
            <span className="truncate">{labelFor(r.from_type, r.from_id, labels)}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{labelFor(r.to_type, r.to_id, labels)}</span>
            <Badge variant="secondary" className="text-xs shrink-0">{ROLE_LABELS[r.role]}</Badge>
            {r.is_primary && (
              <span title="Vínculo principal" className="shrink-0">
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
              </span>
            )}
            <Button
              size="icon" variant="ghost" className="ml-auto shrink-0"
              aria-label="Remover vínculo"
              onClick={() => setPending(r)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && `${labelFor(pending.from_type, pending.from_id, labels)} → ${labelFor(pending.to_type, pending.to_id, labels)} (${ROLE_LABELS[pending.role]})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={() => {
                if (pending) del.mutate(pending.id, { onSuccess: () => setPending(null) });
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
