import type { WebhookTargetEntity } from '@/hooks/useIncomingWebhooks';

/**
 * Templates de webhook por sistema de origem.
 * Cada template define a entidade alvo e o mapping pré-configurado
 * para acelerar onboarding de novas integrações.
 */

export interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  source_system: 'bitrix24' | 'n8n' | 'stripe' | 'github' | 'lovable_form' | 'custom';
  target_entity: WebhookTargetEntity;
  field_mapping: Record<string, string>;
  example_payload: Record<string, unknown>;
}

export const WEBHOOK_TEMPLATES: WebhookTemplate[] = [
  {
    id: 'bitrix24-lead',
    name: 'Bitrix24 — Novo Lead',
    description: 'Recebe leads do Bitrix24 via outbound webhook (handler ONCRMLEADADD).',
    source_system: 'bitrix24',
    target_entity: 'contact',
    field_mapping: {
      first_name: 'data.FIELDS.NAME',
      last_name: 'data.FIELDS.LAST_NAME',
      email: 'data.FIELDS.EMAIL.0.VALUE',
      phone: 'data.FIELDS.PHONE.0.VALUE',
    },
    example_payload: {
      event: 'ONCRMLEADADD',
      data: {
        FIELDS: {
          ID: '12345',
          NAME: 'João',
          LAST_NAME: 'Silva',
          EMAIL: [{ VALUE: 'joao@example.com', VALUE_TYPE: 'WORK' }],
          PHONE: [{ VALUE: '+5511999999999', VALUE_TYPE: 'WORK' }],
        },
      },
    },
  },
  {
    id: 'n8n-generic',
    name: 'n8n — HTTP Request genérico',
    description: 'Payload simples vindo de um nó HTTP do n8n.',
    source_system: 'n8n',
    target_entity: 'contact',
    field_mapping: {
      first_name: 'firstName',
      last_name: 'lastName',
      email: 'email',
      phone: 'phone',
    },
    example_payload: {
      firstName: 'Maria', lastName: 'Souza', email: 'maria@example.com', phone: '+5511988887777',
    },
  },
  {
    id: 'stripe-customer-created',
    name: 'Stripe — customer.created',
    description: 'Cria contato a partir do evento de cliente do Stripe.',
    source_system: 'stripe',
    target_entity: 'contact',
    field_mapping: {
      first_name: 'data.object.name',
      email: 'data.object.email',
      phone: 'data.object.phone',
    },
    example_payload: {
      type: 'customer.created',
      data: { object: { id: 'cus_xxx', name: 'Carlos Lima', email: 'carlos@example.com', phone: '+5511977776666' } },
    },
  },
  {
    id: 'github-issue-opened',
    name: 'GitHub — issues.opened',
    description: 'Cria nota interna a partir de uma issue aberta no GitHub.',
    source_system: 'github',
    target_entity: 'note',
    field_mapping: {
      title: 'issue.title',
      body: 'issue.body',
    },
    example_payload: {
      action: 'opened',
      issue: { number: 42, title: 'Bug no checkout', body: 'Erro 500 ao finalizar compra.' },
      repository: { full_name: 'org/repo' },
    },
  },
  {
    id: 'lovable-form',
    name: 'Formulário Lovable — genérico',
    description: 'Submissão de formulário em outro projeto Lovable.',
    source_system: 'lovable_form',
    target_entity: 'contact',
    field_mapping: {
      first_name: 'name',
      email: 'email',
      phone: 'phone',
    },
    example_payload: {
      name: 'Ana Beatriz', email: 'ana@example.com', phone: '+5511966665555', source: 'landing-pricing',
    },
  },
];

export function getTemplateById(id: string): WebhookTemplate | undefined {
  return WEBHOOK_TEMPLATES.find(t => t.id === id);
}
