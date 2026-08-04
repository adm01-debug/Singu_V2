export type EntityType = 'contacts' | 'companies' | 'interactions';

export interface ColumnConfig {
  key: string;
  label: string;
  selected: boolean;
}

export const entityConfigs: Record<EntityType, { label: string; columns: ColumnConfig[] }> = {
  contacts: {
    label: 'Contatos',
    columns: [
      { key: 'first_name', label: 'Nome', selected: true },
      { key: 'last_name', label: 'Sobrenome', selected: true },
      { key: 'email', label: 'Email', selected: true },
      { key: 'phone', label: 'Telefone', selected: true },
      { key: 'whatsapp', label: 'WhatsApp', selected: true },
      { key: 'role', label: 'Cargo', selected: true },
      { key: 'relationship_score', label: 'Score de Relacionamento', selected: true },
      { key: 'relationship_stage', label: 'Estágio', selected: true },
      { key: 'tags', label: 'Tags', selected: true },
      { key: 'notes', label: 'Notas', selected: false },
      { key: 'linkedin', label: 'LinkedIn', selected: false },
      { key: 'instagram', label: 'Instagram', selected: false },
      { key: 'twitter', label: 'Twitter', selected: false },
      { key: 'birthday', label: 'Aniversário', selected: false },
      { key: 'created_at', label: 'Data de Criação', selected: true },
      { key: 'updated_at', label: 'Última Atualização', selected: true },
    ],
  },
  companies: {
    label: 'Empresas',
    columns: [
      { key: 'name', label: 'Nome', selected: true },
      { key: 'industry', label: 'Indústria', selected: true },
      { key: 'website', label: 'Website', selected: true },
      { key: 'email', label: 'Email', selected: true },
      { key: 'phone', label: 'Telefone', selected: true },
      { key: 'employee_count', label: 'Funcionários', selected: true },
      { key: 'annual_revenue', label: 'Faturamento Anual', selected: true },
      { key: 'financial_health', label: 'Saúde Financeira', selected: true },
      { key: 'city', label: 'Cidade', selected: true },
      { key: 'state', label: 'Estado', selected: true },
      { key: 'tags', label: 'Tags', selected: true },
      { key: 'notes', label: 'Notas', selected: false },
      { key: 'created_at', label: 'Data de Criação', selected: true },
      { key: 'updated_at', label: 'Última Atualização', selected: true },
    ],
  },
  interactions: {
    label: 'Interações',
    columns: [
      { key: 'title', label: 'Título', selected: true },
      { key: 'type', label: 'Tipo', selected: true },
      { key: 'content', label: 'Conteúdo', selected: true },
      { key: 'sentiment', label: 'Sentimento', selected: true },
      { key: 'duration', label: 'Duração', selected: true },
      { key: 'follow_up_required', label: 'Follow-up Necessário', selected: true },
      { key: 'follow_up_date', label: 'Data do Follow-up', selected: true },
      { key: 'tags', label: 'Tags', selected: true },
      { key: 'key_insights', label: 'Insights', selected: false },
      { key: 'created_at', label: 'Data', selected: true },
    ],
  },
};
