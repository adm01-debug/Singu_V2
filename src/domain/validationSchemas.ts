import { z } from "zod";

// ─── Reusable validators ───

export const uuidSchema = z.string().uuid("ID inválido");

export const emailSchema = z
  .string()
  .email("E-mail inválido")
  .max(255, "E-mail muito longo")
  .transform((v) => v.trim().toLowerCase())
  .or(z.literal(""))
  .optional()
  .nullable();

export const phoneSchema = z
  .string()
  .max(30, "Telefone muito longo")
  .regex(/^[\d\s\-+().]*$/, "Formato de telefone inválido")
  .or(z.literal(""))
  .optional()
  .nullable();

export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, "CNPJ inválido")
  .or(z.literal(""))
  .optional()
  .nullable();

export const urlSchema = z
  .string()
  .url("URL inválida")
  .max(2048, "URL muito longa")
  .or(z.literal(""))
  .optional()
  .nullable();

// ─── Contact Schema ───

export const contactFormSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo").transform((v) => v.trim()),
  last_name: z.string().min(1, "Sobrenome é obrigatório").max(100, "Sobrenome muito longo").transform((v) => v.trim()),
  email: emailSchema,
  phone: phoneSchema,
  whatsapp: phoneSchema,
  role_title: z.string().max(100, "Cargo muito longo").optional().nullable(),
  company_id: uuidSchema.optional().nullable(),
  birthday: z.string().optional().nullable(),
  linkedin: urlSchema,
  instagram: z.string().max(100).optional().nullable(),
  twitter: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000, "Notas muito longas").optional().nullable(),
  personal_notes: z.string().max(5000, "Notas muito longas").optional().nullable(),
  tags: z.array(z.string().max(50)).max(20, "Máximo 20 tags").optional().nullable(),
  hobbies: z.array(z.string().max(100)).max(20).optional().nullable(),
  interests: z.array(z.string().max(100)).max(20).optional().nullable(),
  relationship_stage: z.enum(["lead", "prospect", "client", "partner", "inactive", ""]).optional().nullable(),
  sentiment: z.enum(["positive", "neutral", "negative", ""]).optional().nullable(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ─── Company Schema ───

export const companyFormSchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório").max(200, "Nome muito longo").transform((v) => v.trim()),
  razao_social: z.string().max(300).optional().nullable(),
  nome_fantasia: z.string().max(300).optional().nullable(),
  cnpj: cnpjSchema,
  industry: z.string().max(100).optional().nullable(),
  email: emailSchema,
  phone: phoneSchema,
  website: urlSchema,
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  status: z.enum(["active", "inactive", "prospect", "lead", ""]).optional().nullable(),
  employee_count: z.string().max(50).optional().nullable(),
  annual_revenue: z.string().max(50).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(30).optional().nullable(),
  challenges: z.array(z.string().max(200)).max(20).optional().nullable(),
  competitors: z.array(z.string().max(200)).max(20).optional().nullable(),
  // Social media
  linkedin: urlSchema,
  instagram: z.string().max(100).optional().nullable(),
  facebook: urlSchema,
  twitter: z.string().max(100).optional().nullable(),
  youtube: urlSchema,
  tiktok: z.string().max(100).optional().nullable(),
  // Classification
  is_customer: z.boolean().optional().nullable(),
  is_supplier: z.boolean().optional().nullable(),
  is_carrier: z.boolean().optional().nullable(),
  is_matriz: z.boolean().optional().nullable(),
  ramo_atividade: z.string().max(200).optional().nullable(),
  nicho_cliente: z.string().max(200).optional().nullable(),
  tipo_cooperativa: z.string().max(100).optional().nullable(),
  porte_rf: z.string().max(50).optional().nullable(),
  natureza_juridica: z.string().max(10).optional().nullable(),
  natureza_juridica_desc: z.string().max(300).optional().nullable(),
  // Fiscal
  capital_social: z.number().min(0).optional().nullable(),
  data_fundacao: z.string().optional().nullable(),
  situacao_rf: z.string().max(50).optional().nullable(),
  inscricao_estadual: z.string().max(30).optional().nullable(),
  inscricao_municipal: z.string().max(30).optional().nullable(),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;

// ─── Interaction Schema ───

export const interactionFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo").transform((v) => v.trim()),
  type: z.string().min(1, "Tipo é obrigatório"),
  contact_id: uuidSchema,
  company_id: uuidSchema.optional().nullable(),
  content: z.string().max(50000, "Conteúdo muito longo").optional().nullable(),
  sentiment: z.enum(["positive", "neutral", "negative", ""]).optional().nullable(),
  follow_up_required: z.boolean().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().nullable(),
});

export type InteractionFormData = z.infer<typeof interactionFormSchema>;
