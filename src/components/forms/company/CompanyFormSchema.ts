import { z } from 'zod';

export const companyPhoneSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(['fixo', 'celular', 'whatsapp', 'outros']).default('fixo'),
  numero: z.string().min(8, 'Número inválido'),
  ramal: z.string().optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
  contato_nome: z.string().optional().or(z.literal('')),
});

export const companyEmailSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(['comercial', 'financeiro', 'suporte', 'outros']).default('comercial'),
  email: z.string().email('Email inválido'),
  is_primary: z.boolean().default(false),
});

export const companyAddressSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(['comercial', 'entrega', 'cobranca', 'filial', 'deposito']).default('comercial'),
  cep: z.string().optional().or(z.literal('')),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().optional().or(z.literal('')),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'UF deve ter 2 caracteres'),
  pais: z.string().default('Brasil'),
  is_primary: z.boolean().default(false),
});

export const companySchema = z.object({
  nome_crm: z.string().trim().min(1, 'Nome é obrigatório').max(150, 'Máximo 150 caracteres'),
  nome_fantasia: z.string().trim().max(150).optional().or(z.literal('')),
  razao_social: z.string().trim().max(200).optional().or(z.literal('')),
  ramo_atividade: z.string().trim().max(150).optional().or(z.literal('')),
  nicho_cliente: z.string().trim().max(100).optional().or(z.literal('')),
  status: z.string().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  website: z.string().trim().max(300).optional().or(z.literal('')),
  tags_array: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  cnpj: z.string().trim().max(20).optional().or(z.literal('')),
  cnpj_base: z.string().trim().max(10).optional().or(z.literal('')),
  capital_social: z.coerce.number().optional().or(z.literal(0)),
  natureza_juridica: z.string().trim().max(10).optional().or(z.literal('')),
  natureza_juridica_desc: z.string().trim().max(200).optional().or(z.literal('')),
  porte_rf: z.string().trim().max(50).optional().or(z.literal('')),
  situacao_rf: z.string().trim().max(20).optional().or(z.literal('')),
  situacao_rf_data: z.string().optional().or(z.literal('')),
  data_fundacao: z.string().optional().or(z.literal('')),
  inscricao_estadual: z.string().trim().max(30).optional().or(z.literal('')),
  inscricao_municipal: z.string().trim().max(30).optional().or(z.literal('')),
  is_customer: z.boolean().optional(),
  is_supplier: z.boolean().optional(),
  is_carrier: z.boolean().optional(),
  is_matriz: z.boolean().optional(),
  grupo_economico: z.string().trim().max(150).optional().or(z.literal('')),
  grupo_economico_id: z.string().trim().max(50).optional().or(z.literal('')),
  tipo_cooperativa: z.string().trim().max(100).optional().or(z.literal('')),
  numero_cooperativa: z.string().trim().max(50).optional().or(z.literal('')),
  employee_count: z.string().optional(),
  annual_revenue: z.string().trim().max(50).optional().or(z.literal('')),
  financial_health: z.string().optional(),
  cores_marca: z.string().trim().max(100).optional().or(z.literal('')),
  matriz_id: z.string().trim().max(50).optional().or(z.literal('')),
  central_id: z.string().trim().max(50).optional().or(z.literal('')),
  singular_id: z.string().trim().max(50).optional().or(z.literal('')),
  confederacao_id: z.string().trim().max(50).optional().or(z.literal('')),
  bitrix_company_id: z.coerce.number().optional().or(z.literal(0)),
  merge_notes: z.string().trim().max(2000).optional().or(z.literal('')),
  // Composite fields for unified creation
  phones: z.array(companyPhoneSchema).optional(),
  emails: z.array(companyEmailSchema).optional(),
  addresses: z.array(companyAddressSchema).optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

export const employeeCountOptions = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-100', label: '51-100' },
  { value: '101-500', label: '101-500' },
  { value: '500+', label: '500+' },
  { value: 'unknown', label: 'Não informado' },
];

export const financialHealthOptions = [
  { value: 'growing', label: 'Em Crescimento' },
  { value: 'stable', label: 'Estável' },
  { value: 'cutting', label: 'Em Retração' },
  { value: 'excellent', label: 'Excelente' },
  { value: 'good', label: 'Boa' },
  { value: 'average', label: 'Regular' },
  { value: 'poor', label: 'Ruim' },
  { value: 'unknown', label: 'Desconhecido' },
];

export const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' },
];

export const situacaoRfOptions = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'BAIXADA', label: 'Baixada' },
  { value: 'INAPTA', label: 'Inapta' },
  { value: 'SUSPENSA', label: 'Suspensa' },
  { value: 'NULA', label: 'Nula' },
];

export const porteRfOptions = [
  { value: 'MEI', label: 'MEI' },
  { value: 'ME', label: 'ME - Microempresa' },
  { value: 'EPP', label: 'EPP - Empresa de Pequeno Porte' },
  { value: 'MEDIO', label: 'Médio Porte' },
  { value: 'GRANDE', label: 'Grande Porte' },
  { value: 'DEMAIS', label: 'Demais' },
];

export function getCompanyField(company: Record<string, unknown> | null | undefined, field: string, fallback = '') {
  if (!company) return fallback;
  return (company[field] as string) ?? fallback;
}
