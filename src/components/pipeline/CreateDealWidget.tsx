import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateDeal } from '@/hooks/usePipeline';
import { DollarSign, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const CreateDealWidget = React.memo(function CreateDealWidget({ companyId, companyName }: { companyId: string; companyName?: string }) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const createDeal = useCreateDeal();

  const handleCreate = async () => {
    if (!title.trim()) { toast.warning('Informe o título do deal'); return; }
    try {
      await createDeal.mutateAsync({
        p_company_id: companyId,
        p_title: title.trim(),
        p_value: value ? parseFloat(value) : 0,
      });
      toast.success('Deal criado com sucesso!');
      setTitle('');
      setValue('');
    } catch {
      toast.error('Erro ao criar deal');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />Novo Deal
          {companyName && <span className="text-[10px] text-muted-foreground font-normal ml-auto truncate max-w-[120px]">{companyName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do deal..." className="h-8 text-xs" />
        <div className="flex gap-2">
          <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Valor R$" type="number" className="h-8 text-xs flex-1" />
          <Button size="sm" onClick={handleCreate} disabled={createDeal.isPending} className="h-8 text-xs">
            {createDeal.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5 mr-1" />Criar</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default CreateDealWidget;
