import type { UseFormReturn } from 'react-hook-form';
import { Hash, Landmark, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { FormSection } from './CompanyFormSection';
import { situacaoRfOptions, porteRfOptions, type CompanyFormData } from './CompanyFormSchema';

interface CompanyFormFiscalTabProps {
  form: UseFormReturn<CompanyFormData>;
}

export function CompanyFormFiscalTab({ form }: CompanyFormFiscalTabProps) {
  return (
    <div className="space-y-6">
      <FormSection icon={Hash} title="CNPJ & Situação">
        <FormField control={form.control} name="cnpj" render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="cnpj_base" render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ Base</FormLabel>
            <FormControl><Input placeholder="Ex: 12345678" {...field} value={field.value ?? ''} /></FormControl>
            <FormDescription className="text-xs">8 primeiros dígitos</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="situacao_rf" render={({ field }) => (
          <FormItem>
            <FormLabel>Situação RF</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
              <SelectContent>
                {situacaoRfOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="situacao_rf_data" render={({ field }) => (
          <FormItem>
            <FormLabel>Data Situação RF</FormLabel>
            <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>

      <div className="h-px bg-border/50" />

      <FormSection icon={Landmark} title="Dados Legais">
        <FormField control={form.control} name="natureza_juridica" render={({ field }) => (
          <FormItem>
            <FormLabel>Natureza Jurídica (Código)</FormLabel>
            <FormControl><Input placeholder="Ex: 2062" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="natureza_juridica_desc" render={({ field }) => (
          <FormItem>
            <FormLabel>Natureza Jurídica (Descrição)</FormLabel>
            <FormControl><Input placeholder="Ex: Sociedade Empresária LTDA" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="porte_rf" render={({ field }) => (
          <FormItem>
            <FormLabel>Porte (Receita Federal)</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
              <SelectContent>
                {porteRfOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="data_fundacao" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Data de Fundação
            </FormLabel>
            <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="inscricao_estadual" render={({ field }) => (
          <FormItem>
            <FormLabel>Inscrição Estadual</FormLabel>
            <FormControl><Input placeholder="IE" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="inscricao_municipal" render={({ field }) => (
          <FormItem>
            <FormLabel>Inscrição Municipal</FormLabel>
            <FormControl><Input placeholder="IM" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>
    </div>
  );
}
