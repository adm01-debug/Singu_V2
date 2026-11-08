import { describe, expect, it } from 'vitest';
import { companyBrandColorsSchema, companySchema } from './CompanyFormSchema';
import { prepareCompanyWrite } from '@/hooks/useCompanies';

describe('cores da marca no formulário canônico', () => {
  it('valida o texto do formulário e grava o enum em lista', () => {
    const form = companySchema.parse({ nome_crm: 'Empresa', cores_marca: 'Azul; branco, azul marinho' });
    expect(prepareCompanyWrite({ nome_crm: form.nome_crm, cores_marca: companyBrandColorsSchema.parse(form.cores_marca) }))
      .toEqual({ nome_crm: 'Empresa', cores_marca: ['azul', 'branco', 'azul_marinho'] });
  });

  it('permite limpar as cores e rejeita valores fora do enum antes do envio', () => {
    expect(companyBrandColorsSchema.parse('')).toEqual([]);
    expect(companySchema.safeParse({ nome_crm: 'Empresa', cores_marca: '#00ff00' }).success).toBe(false);
  });
});
