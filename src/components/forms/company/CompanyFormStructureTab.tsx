import type { UseFormReturn } from 'react-hook-form';
import { Landmark, Palette, GitMerge } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { FormSection } from './CompanyFormSection';
import { employeeCountOptions, type CompanyFormData } from './CompanyFormSchema';

interface CompanyFormStructureTabProps {
  form: UseFormReturn<CompanyFormData>;
}

export function CompanyFormStructureTab({ form }: CompanyFormStructureTabProps) {
  return (
    <div className="space-y-6">
      <FormSection icon={Landmark} title="Financeiro & Porte">
        <FormField control={form.control} name="employee_count" render={({ field }) => (
          <FormItem>
            <FormLabel>Nº Funcionários</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
              <SelectContent>
                {employeeCountOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="annual_revenue" render={({ field }) => (
          <FormItem>
            <FormLabel>Faturamento Anual</FormLabel>
            <FormControl><Input placeholder="R$ 1-5M" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="bitrix_company_id" render={({ field }) => (
          <FormItem>
            <FormLabel>ID Bitrix24</FormLabel>
            <FormControl><Input type="number" placeholder="ID numérico" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="cores_marca" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
              Cores da Marca
            </FormLabel>
            <FormControl><Input placeholder="Ex: #0066CC, #FF6600" {...field} value={field.value ?? ''} /></FormControl>
            <FormDescription className="text-xs">Cores da identidade visual</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>

      <div className="h-px bg-border/50" />

      <FormSection icon={GitMerge} title="IDs Relacionais">
        <FormField control={form.control} name="matriz_id" render={({ field }) => (
          <FormItem>
            <FormLabel>ID da Matriz</FormLabel>
            <FormControl><Input placeholder="UUID da empresa matriz" className="font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="grupo_economico_id" render={({ field }) => (
          <FormItem>
            <FormLabel>ID Grupo Econômico</FormLabel>
            <FormControl><Input placeholder="UUID do grupo" className="font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="central_id" render={({ field }) => (
          <FormItem>
            <FormLabel>ID Central</FormLabel>
            <FormControl><Input placeholder="UUID da central" className="font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="singular_id" render={({ field }) => (
          <FormItem>
            <FormLabel>ID Singular</FormLabel>
            <FormControl><Input placeholder="UUID da singular" className="font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="confederacao_id" render={({ field }) => (
          <FormItem>
            <FormLabel>ID Confederação</FormLabel>
            <FormControl><Input placeholder="UUID da confederação" className="font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="capital_social" render={({ field }) => (
          <FormItem>
            <FormLabel>Capital Social (R$)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="merge_notes" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Notas de Merge</FormLabel>
            <FormControl><Input placeholder="Notas sobre fusões/incorporações" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>
    </div>
  );
}
