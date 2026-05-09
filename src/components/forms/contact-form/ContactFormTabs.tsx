import { UseFormReturn } from 'react-hook-form';
import { ContactAvatarUpload } from '@/components/forms/ContactAvatarUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/masked-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Briefcase, Tag, FileText } from 'lucide-react';
import type { Company } from '@/hooks/useCompanies';

const roleOptions = [
  { value: 'owner', label: 'Proprietário' }, { value: 'manager', label: 'Gerente' },
  { value: 'buyer', label: 'Comprador' }, { value: 'decision_maker', label: 'Decisor' },
  { value: 'influencer', label: 'Influenciador' }, { value: 'contact', label: 'Contato' },
];

const relationshipStageOptions = [
  { value: 'unknown', label: 'Desconhecido' }, { value: 'prospect', label: 'Prospect' },
  { value: 'qualified_lead', label: 'Lead Qualificado' }, { value: 'opportunity', label: 'Oportunidade' },
  { value: 'negotiation', label: 'Negociação' }, { value: 'customer', label: 'Cliente' },
  { value: 'loyal_customer', label: 'Cliente Fiel' }, { value: 'advocate', label: 'Advogado da Marca' },
  { value: 'at_risk', label: 'Em Risco' }, { value: 'lost', label: 'Perdido' },
];

const sexoOptions = [
  { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' },
  { value: 'NB', label: 'Não-binário' }, { value: 'NI', label: 'Não informado' },
];

interface Props {
  form: UseFormReturn<any>;
  companies: Company[];
  suggestedRoleTitle: string | null;
  contact?: unknown;
}

export function ContactFormTabs({ form, companies, suggestedRoleTitle, contact }: Props) {
  return (
    <Tabs defaultValue="pessoal" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="pessoal" className="text-xs gap-1"><User className="w-3.5 h-3.5" />Pessoal</TabsTrigger>
        <TabsTrigger value="profissional" className="text-xs gap-1"><Briefcase className="w-3.5 h-3.5" />Profissional</TabsTrigger>
        <TabsTrigger value="contato" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />Contato</TabsTrigger>
        <TabsTrigger value="detalhes" className="text-xs gap-1"><Tag className="w-3.5 h-3.5" />Detalhes</TabsTrigger>
      </TabsList>

      <TabsContent value="pessoal" className="space-y-4 mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="João" autoComplete="given-name" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Sobrenome *</FormLabel><FormControl><Input placeholder="Silva" autoComplete="family-name" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="apelido" render={({ field }) => (<FormItem><FormLabel>Apelido</FormLabel><FormControl><Input placeholder="Como é conhecido" autoComplete="nickname" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="nome_tratamento" render={({ field }) => (<FormItem><FormLabel>Nome de Tratamento</FormLabel><FormControl><Input placeholder="Como prefere ser chamado" autoComplete="honorific-prefix" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Usado em comunicações personalizadas</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="sexo" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{sexoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="birthday" render={({ field }) => (<FormItem><FormLabel>Aniversário</FormLabel><FormControl><Input type="date" autoComplete="bday" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      </TabsContent>

      <TabsContent value="profissional" className="space-y-4 mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="company_id" render={({ field }) => (<FormItem><FormLabel>Empresa</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger></FormControl><SelectContent>{companies.map(comp => <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="role_title" render={({ field }) => (<FormItem><FormLabel>Cargo (CRM)</FormLabel><FormControl><Input placeholder={suggestedRoleTitle || "Gerente Comercial"} autoComplete="organization-title" {...field} aria-describedby={suggestedRoleTitle ? "role-title-hint" : undefined} /></FormControl>{suggestedRoleTitle && !field.value && <FormDescription id="role-title-hint" className="text-xs"><button type="button" className="text-primary hover:underline cursor-pointer" onClick={() => form.setValue('role_title', suggestedRoleTitle, { shouldDirty: true })}>Sugestão: {suggestedRoleTitle} ↵</button></FormDescription>}<FormMessage /></FormItem>)} />
          <FormField control={form.control} name="cargo" render={({ field }) => (<FormItem><FormLabel>Cargo (Empresa)</FormLabel><FormControl><Input placeholder="Cargo na empresa" autoComplete="organization-title" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Cargo oficial na empresa</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="departamento" render={({ field }) => (<FormItem><FormLabel>Departamento</FormLabel><FormControl><Input placeholder="Ex: Comercial, TI, RH" autoComplete="organization" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Tipo de Contato</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{roleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="relationship_stage" render={({ field }) => (<FormItem><FormLabel>Estágio do Relacionamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{relationshipStageOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="source" render={({ field }) => (<FormItem><FormLabel>Fonte / Origem</FormLabel><FormControl><Input placeholder="Ex: Marketing, Indicação, Evento" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Como este contato chegou</FormDescription><FormMessage /></FormItem>)} />
        </div>
      </TabsContent>

      <TabsContent value="contato" className="space-y-4 mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="joao@empresa.com.br" type="email" inputMode="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><PhoneInput value={field.value || ''} onChange={(rawValue) => field.onChange(rawValue)} countryCode="BR" aria-describedby="phone-hint" /></FormControl><FormDescription id="phone-hint" className="text-xs">Digite apenas os números</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><PhoneInput value={field.value || ''} onChange={(rawValue) => field.onChange(rawValue)} countryCode="BR" aria-describedby="whatsapp-hint" /></FormControl><FormDescription id="whatsapp-hint" className="text-xs">Número com DDD para WhatsApp</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input placeholder="linkedin.com/in/joaosilva" type="url" inputMode="url" autoComplete="url" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="instagram" render={({ field }) => (<FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@joaosilva" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="twitter" render={({ field }) => (<FormItem><FormLabel>X (Twitter)</FormLabel><FormControl><Input placeholder="@joaosilva" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="assinatura_contato" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Assinatura do Contato</FormLabel><FormControl><Textarea placeholder="Assinatura usada em comunicações..." className="min-h-[60px]" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      </TabsContent>

      <TabsContent value="detalhes" className="space-y-4 mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="tags_array" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Tags</FormLabel><FormControl><Input placeholder="Ex: VIP, Decisor, Agro (separadas por vírgula)" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Separar por vírgula</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="interests_array" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Interesses</FormLabel><FormControl><Input placeholder="Ex: Tecnologia, Inovação, Sustentabilidade (vírgula)" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Separar por vírgula</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="hobbies" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Hobbies</FormLabel><FormControl><Input placeholder="Ex: Futebol, Leitura, Viagens (separadas por vírgula)" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Separar por vírgula</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="notes" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Observações sobre o contato..." className="min-h-[80px]" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="personal_notes" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Notas Pessoais</FormLabel><FormControl><Textarea placeholder="Preferências pessoais, observações privadas..." className="min-h-[80px]" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Informações pessoais para rapport</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="family_info" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Informações Familiares</FormLabel><FormControl><Textarea placeholder="Cônjuge, filhos, aniversários da família..." className="min-h-[60px]" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Informações sobre família para rapport e lembretes</FormDescription><FormMessage /></FormItem>)} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
