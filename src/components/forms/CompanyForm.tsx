import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useExternalLookup } from '@/hooks/useExternalLookup';
import { useCompanyPhones, useCompanyEmails, useCompanyAddresses, useCompanySocialMedia } from '@/hooks/useCompanyRelatedData';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Loader2, FileText, Users, Landmark, Share2, MapPin, Phone, Sparkles } from 'lucide-react';
import type { Company } from '@/hooks/useCompanies';
import { CompanyPhonesForm } from '@/components/forms/company/CompanyPhonesForm';
import { CompanyEmailsForm } from '@/components/forms/company/CompanyEmailsForm';
import { CompanyAddressesForm } from '@/components/forms/company/CompanyAddressesForm';
import { CompanySocialMediaForm } from '@/components/forms/company/CompanySocialMediaForm';
import { companySchema, getCompanyField, type CompanyFormData } from './company/CompanyFormSchema';
import { CompanyFormBasicTab } from './company/CompanyFormBasicTab';
import { CompanyFormFiscalTab } from './company/CompanyFormFiscalTab';
import { CompanyFormClassificationTab } from './company/CompanyFormClassificationTab';
import { CompanyFormStructureTab } from './company/CompanyFormStructureTab';
import { CompanyFormCompositeFields } from './company/CompanyFormCompositeFields';

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CompanyForm({ company, onSubmit, onCancel, isSubmitting }: CompanyFormProps) {
  const c = company as Record<string, unknown> | null;
  const companyId = (c?.id as string) || undefined;
  const isEditing = !!company;
  const [logoUrl, setLogoUrl] = useState<string | null>((c?.logo_url as string) || null);

  const { data: ramosOptions = [], isLoading: ramosLoading } = useExternalLookup('companies', 'ramo_atividade');
  const { data: nichosOptions = [], isLoading: nichosLoading } = useExternalLookup('companies', 'nicho_cliente');

  const phonesHook = useCompanyPhones(companyId);
  const emailsHook = useCompanyEmails(companyId);
  const addressesHook = useCompanyAddresses(companyId);
  const socialMediaHook = useCompanySocialMedia(companyId);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    mode: 'onBlur',
    defaultValues: {
      nome_crm: getCompanyField(c, 'nome_crm') || getCompanyField(c, 'name') || getCompanyField(c, 'nome_fantasia'),
      nome_fantasia: getCompanyField(c, 'nome_fantasia'),
      razao_social: getCompanyField(c, 'razao_social'),
      ramo_atividade: getCompanyField(c, 'ramo_atividade'),
      nicho_cliente: getCompanyField(c, 'nicho_cliente'),
      status: getCompanyField(c, 'status', 'ativo'),
      notes: getCompanyField(c, 'notes'),
      website: getCompanyField(c, 'website'),
      tags_array: Array.isArray(c?.tags_array) ? (c.tags_array as string[]) : [],
      challenges: Array.isArray(c?.challenges) ? (c.challenges as string[]) : [],
      competitors: Array.isArray(c?.competitors) ? (c.competitors as string[]) : [],
      cnpj: getCompanyField(c, 'cnpj'),
      cnpj_base: getCompanyField(c, 'cnpj_base'),
      capital_social: (c?.capital_social as number) ?? 0,
      natureza_juridica: getCompanyField(c, 'natureza_juridica'),
      natureza_juridica_desc: getCompanyField(c, 'natureza_juridica_desc'),
      porte_rf: getCompanyField(c, 'porte_rf'),
      situacao_rf: getCompanyField(c, 'situacao_rf'),
      situacao_rf_data: getCompanyField(c, 'situacao_rf_data'),
      data_fundacao: getCompanyField(c, 'data_fundacao'),
      inscricao_estadual: getCompanyField(c, 'inscricao_estadual'),
      inscricao_municipal: getCompanyField(c, 'inscricao_municipal'),
      is_customer: (c?.is_customer as boolean) ?? false,
      is_supplier: (c?.is_supplier as boolean) ?? false,
      is_carrier: (c?.is_carrier as boolean) ?? false,
      is_matriz: (c?.is_matriz as boolean) ?? undefined,
      grupo_economico: getCompanyField(c, 'grupo_economico'),
      grupo_economico_id: getCompanyField(c, 'grupo_economico_id'),
      tipo_cooperativa: getCompanyField(c, 'tipo_cooperativa'),
      numero_cooperativa: getCompanyField(c, 'numero_cooperativa'),
      employee_count: getCompanyField(c, 'employee_count'),
      annual_revenue: getCompanyField(c, 'annual_revenue'),
      financial_health: getCompanyField(c, 'financial_health', 'unknown'),
      cores_marca: getCompanyField(c, 'cores_marca'),
      matriz_id: getCompanyField(c, 'matriz_id'),
      central_id: getCompanyField(c, 'central_id'),
      singular_id: getCompanyField(c, 'singular_id'),
      confederacao_id: getCompanyField(c, 'confederacao_id'),
      bitrix_company_id: (c?.bitrix_company_id as number) ?? 0,
      merge_notes: getCompanyField(c, 'merge_notes'),
    },
  });

  const draftKey = company ? `company-edit-${(company as Record<string, unknown>).id}` : 'company-new';
  const { clearDraft } = useFormDraft(form, { key: draftKey, enabled: !company });

  const handleSubmit = async (data: CompanyFormData) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      } else if ((key === 'capital_social' || key === 'bitrix_company_id') && (value === 0 || value === null)) {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }
    if (Array.isArray(data.tags_array) && data.tags_array.length === 0) cleaned.tags_array = null;
    if (Array.isArray(data.challenges) && data.challenges.length === 0) cleaned.challenges = null;
    if (Array.isArray(data.competitors) && data.competitors.length === 0) cleaned.competitors = null;
    cleaned.logo_url = logoUrl;
    delete cleaned.razao_social_fiscal;
    await onSubmit(cleaned);
    clearDraft();
  };

  const allTabs = [
    { value: 'basico', label: 'Básico', icon: Building2 },
    { value: 'fiscal', label: 'Fiscal', icon: FileText },
    { value: 'classificacao', label: 'Classificação', icon: Users },
    { value: 'contatos_end', label: 'Contato & Endereço', icon: MapPin },
    { value: 'estrutura', label: 'Estrutura', icon: Landmark },
    { value: 'telefones', label: 'Telefones', icon: Phone },
    { value: 'endereco', label: 'Endereços', icon: MapPin },
    { value: 'redes', label: 'Redes', icon: Share2 },
  ];

  const createTabs = allTabs.slice(0, 4); // basic, fiscal, classification, contacts_end
  const visibleTabs = isEditing ? [
    ...allTabs.slice(0, 3), // basic, fiscal, classification
    allTabs[4], // structure
    allTabs[5], // phones
    allTabs[6], // addresses
    allTabs[7], // networks
  ] : createTabs;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col max-h-[calc(90vh-2rem)]">
        <div className="pb-4 mb-1 shrink-0 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEditing ? 'Atualize as informações da empresa' : 'Preencha os dados da empresa'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          <Tabs defaultValue="basico" className="w-full">
            {visibleTabs.length > 1 && (
              <TabsList className="grid w-full mb-4 h-auto gap-1 p-0.5 bg-muted/30 border border-border" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
                {visibleTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="min-w-0 px-2 text-xs gap-1.5 py-2 data-[state=active]:bg-card data-[state=active]:border-border rounded-md">
                    <tab.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden min-w-0 truncate sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <TabsContent value="basico" className="mt-0">
              <CompanyFormBasicTab
                form={form}
                logoUrl={logoUrl}
                onLogoChange={setLogoUrl}
                companyId={companyId}
                isEditing={isEditing}
                ramosOptions={ramosOptions}
                ramosLoading={ramosLoading}
                nichosOptions={nichosOptions}
                nichosLoading={nichosLoading}
              />
            </TabsContent>

            <TabsContent value="fiscal" className="mt-0">
              <CompanyFormFiscalTab form={form} />
            </TabsContent>

            <TabsContent value="classificacao" className="mt-0">
              <CompanyFormClassificationTab form={form} />
            </TabsContent>

            {!isEditing && (
              <TabsContent value="contatos_end" className="mt-0">
                <CompanyFormCompositeFields form={form} />
              </TabsContent>
            )}

            <TabsContent value="estrutura" className="mt-0">
              <CompanyFormStructureTab form={form} />
            </TabsContent>

            {isEditing && (
              <>
                <TabsContent value="telefones" className="mt-0">
                  <CompanyPhonesForm companyId={companyId!} phones={phonesHook.data} onSave={(p) => phonesHook.upsert.mutateAsync(p)} onDelete={(id) => phonesHook.remove.mutateAsync(id)} isLoading={phonesHook.isLoading} />
                  <div className="mt-6"><CompanyEmailsForm companyId={companyId!} emails={emailsHook.data} onSave={(e) => emailsHook.upsert.mutateAsync(e)} onDelete={(id) => emailsHook.remove.mutateAsync(id)} isLoading={emailsHook.isLoading} /></div>
                </TabsContent>
                <TabsContent value="endereco" className="mt-0">
                  <CompanyAddressesForm companyId={companyId!} addresses={addressesHook.data} onSave={(a) => addressesHook.upsert.mutateAsync(a)} onDelete={(id) => addressesHook.remove.mutateAsync(id)} isLoading={addressesHook.isLoading} />
                </TabsContent>
                <TabsContent value="redes" className="mt-0">
                  <CompanySocialMediaForm companyId={companyId!} socialMedia={socialMediaHook.data} onSave={(s) => socialMediaHook.upsert.mutateAsync(s)} onDelete={(id) => socialMediaHook.remove.mutateAsync(id)} isLoading={socialMediaHook.isLoading} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        <div className="pt-4 mt-1 shrink-0 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Empresa'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
