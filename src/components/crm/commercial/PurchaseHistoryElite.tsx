import { 
  ShoppingBag, 
  ArrowUpRight, 
  Calendar, 
  Package,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

export function PurchaseHistoryElite({ contactId }: Props) {
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchase-history-elite', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_history')
        .select('id, amount, contact_id, created_at, cycle_months, notes, product_category, product_name, purchase_date, renewal_date, updated_at, user_id')
        .eq('contact_id', contactId)
        .order('purchase_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <div className="h-48 flex items-center justify-center animate-pulse bg-muted/20 rounded-xl" />;
  }

  if (!purchases || purchases.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium">Sem histórico de compras</p>
          <p className="text-xs text-muted-foreground">O histórico aparecerá quando transações forem processadas.</p>
        </CardContent>
      </Card>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Histórico Transacional</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Audit Trail de Receita</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Volume Total</p>
          <p className="text-sm font-bold text-indigo-600">R$ {totalSpent.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {purchases.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="group relative flex items-center gap-4 rounded-xl border bg-background p-3 transition-all hover:shadow-md hover:border-indigo-200">
              <div className="p-2.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Package className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold truncate">{p.product_name}</h4>
                  <span className="text-sm font-bold text-foreground shrink-0">
                    R$ {Number(p.amount || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(p.purchase_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </div>
                  {p.product_category && (
                    <Badge variant="outline" className="text-[9px] h-4 uppercase tracking-tighter">
                      {p.product_category}
                    </Badge>
                  )}
                </div>

                {p.renewal_date && (
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-dashed border-border/60">
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold uppercase">
                      <TrendingUp className="h-2.5 w-2.5" />
                      Renovação Próxima
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {format(new Date(p.renewal_date), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Projeção */}
      <div className="p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-indigo-700 uppercase">Projeção de LTV (Próximos 12m)</span>
          <ArrowUpRight className="h-3 w-3 text-indigo-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">R$ {(totalSpent * 1.4).toLocaleString('pt-BR')}</span>
          <span className="text-[10px] text-emerald-600 font-bold">+40% vs atual</span>
        </div>
      </div>
    </div>
  );
}