import type { UseFormReturn } from 'react-hook-form';
import { Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { FormSection } from './CompanyFormSection';
import { financialHealthOptions, employeeCountOptions, type CompanyFormData } from './CompanyFormSchema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompanyFormClassificationTabProps {
  form: UseFormReturn<CompanyFormData>;
}

export function CompanyFormClassificationTab({ form }: CompanyFormClassificationTabProps) {
  return (
    <div className="space-y-6">
      <FormSection icon={Shield} title="Tipo de Parceiro">
        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <FormField control={form.control} name="is_customer" render={({ field }) => (
              <FormItem className="flex items-center gap-2.5 space-y-0">
                <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="font-normal cursor-pointer text-sm">Cliente Ativo</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="is_supplier" render={({ field }) => (
              <FormItem className="flex items-center gap-2.5 space-y-0">
                <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="font-normal cursor-pointer text-sm">Fornecedor</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="is_carrier" render={({ field }) => (
              <FormItem className="flex items-center gap-2.5 space-y-0">
                <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="font-normal cursor-pointer text-sm">Transportadora</FormLabel>
              </FormItem>
            )} />
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="is_matriz" render={({ field }) => (
            <FormItem className="flex items-center gap-2.5 space-y-0 p-3 rounded-lg bg-muted/20 border border-border/30">
              <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
              <div className="space-y-1">
                <FormLabel className="font-normal cursor-pointer text-sm">É Matriz</FormLabel>
                <FormDescription className="text-[10px] leading-none">(desmarque para filial)</FormDescription>
              </div>
            </FormItem>
          )} />
          <FormField control={form.control} name="financial_health" render={({ field }) => (
            <FormItem>
              <FormLabel>Saúde Financeira</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'unknown'}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                <SelectContent>
                  {financialHealthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="grupo_economico" render={({ field }) => (
          <FormItem>
            <FormLabel>Grupo Econômico</FormLabel>
            <FormControl><Input placeholder="Ex: Coanorp Cooperativa" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="employee_count" render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Funcionários</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || 'unknown'}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a faixa" /></SelectTrigger></FormControl>
              <SelectContent>
                {employeeCountOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tipo_cooperativa" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Cooperativa</FormLabel>
            <FormControl><Input placeholder="Ex: Singular, Central..." {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="numero_cooperativa" render={({ field }) => (
          <FormItem>
            <FormLabel>Nº da Cooperativa</FormLabel>
            <FormControl><Input placeholder="Número de registro" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>
    </div>
  );
}
