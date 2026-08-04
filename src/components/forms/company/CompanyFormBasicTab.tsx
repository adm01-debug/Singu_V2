import type { UseFormReturn } from 'react-hook-form';
import { Building2, Briefcase, Globe, Tag, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { CompanyLogoUpload } from '@/components/forms/CompanyLogoUpload';
import { SearchableSelectWithApproval } from '@/components/ui/searchable-select';
import { TagInput } from '@/components/ui/tag-input';
import { FormSection } from './CompanyFormSection';
import { statusOptions, type CompanyFormData } from './CompanyFormSchema';

interface CompanyFormBasicTabProps {
  form: UseFormReturn<CompanyFormData>;
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  companyId?: string;
  isEditing: boolean;
  ramosOptions: string[];
  ramosLoading: boolean;
  nichosOptions: string[];
  nichosLoading: boolean;
}

export function CompanyFormBasicTab({
  form, logoUrl, onLogoChange, companyId, isEditing,
  ramosOptions, ramosLoading, nichosOptions, nichosLoading,
}: CompanyFormBasicTabProps) {
  return (
    <div className="space-y-6">
      <FormSection icon={Building2} title="Identificação">
        <div className="md:col-span-2 flex items-start gap-4">
          <CompanyLogoUpload logoUrl={logoUrl} onLogoChange={onLogoChange} companyId={companyId} />
          <FormField control={form.control} name="nome_crm" render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-foreground font-medium">Nome no CRM <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="Nome usado internamente" {...field} /></FormControl>
              <FormDescription className="text-xs">Nome principal exibido nas listagens e buscas</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="nome_fantasia" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Fantasia</FormLabel>
            <FormControl><Input placeholder="Nome comercial" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="razao_social" render={({ field }) => (
          <FormItem>
            <FormLabel>Razão Social</FormLabel>
            <FormControl><Input placeholder="Razão social completa" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>

      <div className="h-px bg-border/50" />

      <FormSection icon={Briefcase} title="Classificação">
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || 'ativo'}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
              <SelectContent>
                {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="ramo_atividade" render={({ field }) => (
          <FormItem>
            <FormLabel>Ramo de Atividade</FormLabel>
            <FormControl>
              <SearchableSelectWithApproval value={field.value ?? ''} onValueChange={field.onChange} options={ramosOptions} isLoading={ramosLoading} placeholder="Selecione o ramo" searchPlaceholder="Buscar ramo..." fieldName="ramo_atividade" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="nicho_cliente" render={({ field }) => (
          <FormItem>
            <FormLabel>Nicho do Cliente</FormLabel>
            <FormControl>
              <SearchableSelectWithApproval value={field.value ?? ''} onValueChange={field.onChange} options={nichosOptions} isLoading={nichosLoading} placeholder="Selecione o nicho" searchPlaceholder="Buscar nicho..." fieldName="nicho_cliente" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="website" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Website
            </FormLabel>
            <FormControl><Input placeholder="https://www.empresa.com.br" type="url" inputMode="url" autoComplete="url" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>

      <div className="h-px bg-border/50" />

      <FormSection icon={Tag} title="Anotações e Tags">
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Notas</FormLabel>
            <FormControl><Textarea placeholder="Observações sobre a empresa..." className="min-h-[100px] resize-y" {...field} value={field.value ?? ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tags_array" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Tags</FormLabel>
            <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ex: VIP, Cooperativa, Agro — pressione Enter" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="challenges" render={({ field }) => (
          <FormItem>
            <FormLabel>Desafios</FormLabel>
            <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ex: Logística, Custos" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="competitors" render={({ field }) => (
          <FormItem>
            <FormLabel>Concorrentes</FormLabel>
            <FormControl><TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ex: Empresa A, Empresa B" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormSection>

      {!isEditing && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Complete as abas acima e não esqueça de adicionar <strong>Contato & Endereço</strong> na nova aba disponível!</span>
        </div>
      )}
    </div>
  );
}
