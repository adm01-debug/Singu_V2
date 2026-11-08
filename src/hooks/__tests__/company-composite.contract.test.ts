import { describe, expect, it } from 'vitest';
import { companySchema } from '@/components/forms/company/CompanyFormSchema';
import { prepareCompanyRelations } from '../useCompanies';

describe('dados compostos da empresa no contrato canônico', () => {
  it('converte os três formatos reais do formulário sem perder dados', () => {
    const input = companySchema.parse({
      nome_crm: 'Empresa',
      phones: [{ tipo: 'fixo', numero: '11999999999', ramal: '10', contato_nome: 'Ana', is_primary: true }],
      emails: [{ tipo: 'suporte', email: 'suporte@example.test', is_primary: true }],
      addresses: [{ tipo: 'entrega', logradouro: 'Rua A', numero: '12', cidade: 'Campinas', estado: 'SP', pais: 'Brasil', is_primary: true }],
    });
    const relations = prepareCompanyRelations({ phones: input.phones, emails: input.emails, addresses: input.addresses });
    expect(relations.phones).toEqual([{ numero: '11999999999', ramal: '10', is_primary: true, phone_type: 'fixo_comercial', observacao: 'Contato: Ana' }]);
    expect(relations.emails).toEqual([{ email: 'suporte@example.test', is_primary: true, email_type: null, departamento: 'suporte' }]);
    expect(relations.addresses[0]).toMatchObject({ tipo: 'entrega', cidade: 'Campinas', estado: 'SP', numero: '12', pais: 'Brasil' });
  });

  it('identifica WhatsApp sem assumir um tipo de aparelho e mantém o enum canônico explícito', () => {
    expect(prepareCompanyRelations({ phones: [{ tipo: 'whatsapp', numero: '11999999999' }] }).phones[0])
      .toMatchObject({ is_whatsapp: true, phone_type: null });
    expect(prepareCompanyRelations({ phones: [{ numero: '11999999999', phone_type: 'celular_pessoal' }] }).phones[0].phone_type).toBe('celular_pessoal');
  });

  it('deduplica os aliases básicos sem substituir os metadados compostos', () => {
    const relations = prepareCompanyRelations({
      phone: '(11) 99999-9999', email: 'VENDAS@example.test', address: 'Rua A', city: 'Campinas', state: 'SP',
      phones: [{ numero: '11999999999', ramal: '20', is_primary: false }],
      emails: [{ email: 'vendas@example.test', departamento: 'Vendas' }],
      addresses: [{ logradouro: 'Rua A', cidade: 'Campinas', estado: 'SP', numero: '12' }],
    });
    expect(relations.phones).toEqual([{ numero: '11999999999', ramal: '20', is_primary: true }]);
    expect(relations.emails).toEqual([{ email: 'vendas@example.test', departamento: 'Vendas', is_primary: true }]);
    expect(relations.addresses).toHaveLength(1);
    expect(relations.addresses[0]).toMatchObject({ numero: '12', is_primary: true });
  });

  it('conserva contatos diferentes e não apaga os compostos quando o básico fica vazio', () => {
    const input = { phones: [{ numero: '11999999999', is_primary: true }], emails: [{ email: 'a@example.test', is_primary: true }] };
    expect(prepareCompanyRelations({ ...input, phone: null, email: null })).toMatchObject(input);
    const combined = prepareCompanyRelations({ ...input, phone: '11888888888', email: 'b@example.test' });
    expect(combined.phones).toHaveLength(2);
    expect(combined.emails).toHaveLength(2);
    expect(combined.phones.filter(phone => phone.is_primary).map(phone => phone.numero)).toEqual(['11888888888']);
    expect(input.phones[0].is_primary).toBe(true);
  });

  it('recusa chaves e tipos desconhecidos antes de criar qualquer registro', () => {
    const invalid = { phones: [{ numero: '11999999999', company_id: 'outro' }] };
    expect(() => prepareCompanyRelations(invalid)).toThrow();
    expect(() => prepareCompanyRelations({ emails: [{ email: 'inválido' }] })).toThrow();
  });
});
