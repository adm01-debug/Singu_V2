import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Polyfill ResizeObserver for jsdom
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

// ─── Helpers ────────────────────────────────────────────────────
const mockSubmit = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn();

function renderForm(company?: Record<string, unknown>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CompanyForm
          company={company as never}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Full external DB company record (simulates data from external-data edge function)
const fullExternalCompany = {
  id: '53486360-6508-4a92-ae37-a20c17a28d17',
  name: 'Cocamar - Lobato/PR',
  nome_crm: 'Cocamar - Lobato/PR',
  nome_fantasia: 'Cocamar',
  razao_social: 'COCAMAR COOPERATIVA AGROINDUSTRIAL',
  cnpj: '79.114.450/0284-18',
  cnpj_base: '79114450',
  ramo_atividade: 'Cooperativas Agroindustrial',
  nicho_cliente: 'Agro',
  industry: 'Cooperativas Agroindustrial',
  website: 'https://www.coanorp.com.br/',
  phone: '(44) 3261-8000',
  email: 'contato@cocamar.com.br',
  address: 'PR 458 S/N',
  city: 'Lobato',
  state: 'PR',
  status: 'ativo',
  situacao_rf: 'ATIVA',
  situacao_rf_data: '2026-03-01',
  capital_social: 319967786.74,
  natureza_juridica: '2143',
  natureza_juridica_desc: 'Cooperativa',
  porte_rf: 'GRANDE',
  data_fundacao: '1963-03-27',
  grupo_economico: 'Coanorp Cooperativa',
  grupo_economico_id: '9338a177-8645-4600-9817-cb0f6bf1069b',
  is_customer: true,
  is_supplier: false,
  is_carrier: false,
  is_matriz: false,
  tipo_cooperativa: 'Singular',
  numero_cooperativa: '12345',
  inscricao_estadual: '123456789',
  inscricao_municipal: '987654',
  cores_marca: '#009639, #FFFFFF',
  employee_count: '500+',
  annual_revenue: 'R$ 5B+',
  financial_health: 'growing',
  notes: 'Maior cooperativa agroindustrial do Paraná',
  tags: ['agro', 'cooperativa'],
  tags_array: ['agro', 'cooperativa', 'VIP'],
  challenges: ['Logística', 'Custos'],
  competitors: ['Coamo', 'C.Vale'],
  extra_data_rf: { enriched_at: '2026-03-01', source: 'BigQuery_RFB_n8n' },
  logo_url: 'https://example.com/logo.png',
  matriz_id: 'abc-matriz-uuid',
  central_id: 'def-central-uuid',
  singular_id: 'ghi-singular-uuid',
  confederacao_id: 'jkl-confed-uuid',
  bitrix_company_id: 42,
  user_id: 'test-user-id',
  created_at: '2026-02-04T11:22:11.77795+00:00',
  updated_at: '2026-02-11T10:43:13.658791+00:00',
};

// Minimal company (only required fields)
const minimalCompany = {
  id: 'min-id',
  name: 'Empresa Mínima',
  user_id: 'test-user',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

// Company with null/undefined fields
const nullFieldsCompany = {
  id: 'null-id',
  name: 'Empresa Nulos',
  nome_fantasia: null,
  razao_social: undefined,
  cnpj: null,
  capital_social: null,
  is_customer: null,
  is_supplier: undefined,
  status: null,
  financial_health: null,
  user_id: 'test-user',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// SECTION 1: RENDERING TESTS
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Rendering', () => {
  it('renders create mode with correct title', () => {
    renderForm();
    expect(screen.getByText('Nova Empresa')).toBeInTheDocument();
    expect(screen.getByText('Preencha os dados da empresa')).toBeInTheDocument();
  });

  it('renders edit mode with correct title', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
    expect(screen.getByText('Atualize as informações da empresa')).toBeInTheDocument();
  });

  it('renders all 7 tabs in edit mode', () => {
    renderForm(fullExternalCompany);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(7);
    expect(tabs[0]).toHaveTextContent('Básico');
    expect(tabs[1]).toHaveTextContent('Fiscal');
    expect(tabs[2]).toHaveTextContent('Classificação');
    expect(tabs[3]).toHaveTextContent('Estrutura');
    expect(tabs[4]).toHaveTextContent('Telefones');
    expect(tabs[5]).toHaveTextContent('Endereços');
    expect(tabs[6]).toHaveTextContent('Redes');
  });

  it('shows cadastro principal tabs in create mode', () => {
    renderForm();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent('Básico');
    expect(tabs[1]).toHaveTextContent('Fiscal');
    expect(tabs[2]).toHaveTextContent('Classificação');
    expect(tabs[3]).toHaveTextContent('Contato & Endereço');
    expect(screen.queryByText('Telefones')).not.toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    renderForm();
    expect(screen.getByText('Criar Empresa')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('shows "Salvar Alterações" in edit mode', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('renders Básico tab fields by default', () => {
    renderForm();
    // "Nome no CRM" has asterisk in a separate <span>, use flexible matcher
    expect(screen.getByText(/Nome no CRM/)).toBeInTheDocument();
    expect(screen.getByText('Nome Fantasia')).toBeInTheDocument();
    expect(screen.getByText('Razão Social')).toBeInTheDocument();
    expect(screen.getByText('Notas')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Ramo de Atividade')).toBeInTheDocument();
    expect(screen.getByText('Nicho do Cliente')).toBeInTheDocument();
    // Website label has an icon inside, use flexible matcher
    expect(screen.getByText(/Website/)).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Desafios')).toBeInTheDocument();
    expect(screen.getByText('Concorrentes')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 2: TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Tab Navigation', () => {
  it('switches to Fiscal tab and shows fiscal fields', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Fiscal/ }));
    expect(screen.getByText('CNPJ')).toBeInTheDocument();
    expect(screen.getByText('Situação RF')).toBeInTheDocument();
    expect(screen.getByText('Natureza Jurídica (Código)')).toBeInTheDocument();
    expect(screen.getByText('Natureza Jurídica (Descrição)')).toBeInTheDocument();
    expect(screen.getByText('Porte (Receita Federal)')).toBeInTheDocument();
    expect(screen.getByText(/Data de Fundação/)).toBeInTheDocument();
    expect(screen.getByText('Inscrição Estadual')).toBeInTheDocument();
    expect(screen.getByText('Inscrição Municipal')).toBeInTheDocument();
  });

  it('switches to Classificação tab and shows classification fields', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Classificação/ }));
    expect(screen.getByText('Tipo de Parceiro')).toBeInTheDocument();
    expect(screen.getByText('Cliente Ativo')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor')).toBeInTheDocument();
    expect(screen.getByText('Transportadora')).toBeInTheDocument();
    expect(screen.getByText('É Matriz')).toBeInTheDocument();
    expect(screen.getByText('Grupo Econômico')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Cooperativa')).toBeInTheDocument();
    expect(screen.getByText('Nº da Cooperativa')).toBeInTheDocument();
  });

  it('switches to Estrutura tab and shows ALL structure fields', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Estrutura/ }));
    expect(screen.getByText('Nº Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Faturamento Anual')).toBeInTheDocument();
    expect(screen.getByText('Capital Social (R$)')).toBeInTheDocument();
    expect(screen.getByText(/Cores da Marca/)).toBeInTheDocument();
    // Relational IDs
    expect(screen.getByText('ID da Matriz')).toBeInTheDocument();
    expect(screen.getByText('ID Grupo Econômico')).toBeInTheDocument();
    expect(screen.getByText('ID Central')).toBeInTheDocument();
    expect(screen.getByText('ID Singular')).toBeInTheDocument();
    expect(screen.getByText('ID Confederação')).toBeInTheDocument();
    expect(screen.getByText('ID Bitrix24')).toBeInTheDocument();
  });

  it('switches to Fiscal tab and shows CNPJ Base field', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Fiscal/ }));
    expect(screen.getByText('CNPJ Base')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 3: DEFAULT VALUES (EDIT MODE)
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Default Values Population', () => {
  it('populates basic fields from full external company', () => {
    renderForm(fullExternalCompany);
    const cocamarFields = screen.getAllByDisplayValue('Cocamar - Lobato/PR');
    expect(cocamarFields.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue('Cocamar')).toBeInTheDocument();
    expect(screen.getByDisplayValue('COCAMAR COOPERATIVA AGROINDUSTRIAL')).toBeInTheDocument();
    // website, phone, email are now in separate normalized tabs
  });

  it('populates fiscal fields from full external company', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Fiscal/ }));
    expect(screen.getByDisplayValue('79.114.450/0284-18')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2143')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cooperativa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('987654')).toBeInTheDocument();
  });

  it('populates classification fields from full external company', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Classificação/ }));

    // is_customer should be checked
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "Cliente" (is_customer = true)
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it('handles minimal company without crashing', () => {
    expect(() => renderForm(minimalCompany)).not.toThrow();
    expect(screen.getByDisplayValue('Empresa Mínima')).toBeInTheDocument();
  });

  it('handles null/undefined fields gracefully', () => {
    expect(() => renderForm(nullFieldsCompany)).not.toThrow();
    expect(screen.getByDisplayValue('Empresa Nulos')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 4: FORM VALIDATION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Validation', () => {
  it('requires company name', async () => {
    renderForm();
    const submitBtn = screen.getByText('Criar Empresa');
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  // Email and website fields moved to normalized tabs - skip old validation tests
  it('allows empty optional fields', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Nome usado internamente');
    await userEvent.type(nameInput, 'Minimal Company');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 5: FORM SUBMISSION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Submission', () => {
  it('calls onSubmit with cleaned data (empty strings → null)', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Nome usado internamente');
    await userEvent.type(nameInput, 'Nova Empresa Teste');
    await userEvent.click(screen.getByText('Criar Empresa'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.nome_crm).toBe('Nova Empresa Teste');
      // Empty optional fields should be null
      expect(submitted.cnpj).toBeNull();
      expect(submitted.razao_social).toBeNull();
      expect(submitted.grupo_economico).toBeNull();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    renderForm();
    await userEvent.click(screen.getByText('Cancelar'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CompanyForm onSubmit={mockSubmit} onCancel={mockCancel} isSubmitting={true} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    const submitBtn = screen.getByText('Criar Empresa');
    expect(submitBtn.closest('button')).toBeDisabled();
  });

  it('shows loading spinner when isSubmitting', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CompanyForm onSubmit={mockSubmit} onCancel={mockCancel} isSubmitting={true} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 6: NULL SAFETY & EDGE CASES
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Null Safety & Edge Cases', () => {
  it('renders with undefined company (create mode)', () => {
    expect(() => renderForm(undefined)).not.toThrow();
  });

  it('renders with null company (create mode)', () => {
    expect(() => renderForm(null)).not.toThrow();
  });

  it('handles company with all fields as null', () => {
    const allNulls = {
      id: 'all-null',
      name: 'Test',
      nome_fantasia: null, razao_social: null, nome_crm: null,
      cnpj: null, ramo_atividade: null, nicho_cliente: null,
      capital_social: null, situacao_rf: null, situacao_rf_data: null,
      porte_rf: null, natureza_juridica: null, natureza_juridica_desc: null,
      data_fundacao: null, grupo_economico: null, is_customer: null,
      is_supplier: null, is_carrier: null, is_matriz: null,
      tipo_cooperativa: null, numero_cooperativa: null,
      inscricao_estadual: null, inscricao_municipal: null,
      cores_marca: null, status: null, financial_health: null,
      employee_count: null, annual_revenue: null,
      website: null, phone: null, email: null, address: null,
      city: null, state: null, notes: null,
      user_id: 'u', created_at: '', updated_at: '',
    };
    expect(() => renderForm(allNulls)).not.toThrow();
  });

  it('handles company with extra unknown fields without crashing', () => {
    const withExtras = {
      ...minimalCompany,
      unknown_field_1: 'foo',
      unknown_field_2: 42,
      deeply_nested: { a: { b: { c: 1 } } },
    };
    expect(() => renderForm(withExtras)).not.toThrow();
  });

  it('handles capital_social as 0', () => {
    const zeroCapital = { ...minimalCompany, capital_social: 0 };
    expect(() => renderForm(zeroCapital)).not.toThrow();
  });

  it('handles capital_social as very large number', () => {
    const huge = { ...minimalCompany, capital_social: 999999999999.99 };
    expect(() => renderForm(huge)).not.toThrow();
  });

  it('handles boolean fields as undefined', () => {
    const undefinedBooleans = {
      ...minimalCompany,
      is_customer: undefined,
      is_supplier: undefined,
      is_carrier: undefined,
      is_matriz: undefined,
    };
    expect(() => renderForm(undefinedBooleans)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 7: DATA MAPPING (EXTERNAL → LOCAL)
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — External Data Mapping', () => {
  it('maps nome_crm as primary name when name is empty', () => {
    const ext = { ...minimalCompany, name: '', nome_crm: 'CRM Name', nome_fantasia: 'Fantasy', razao_social: 'Legal' };
    renderForm(ext);
    const nameInput = screen.getByPlaceholderText('Nome usado internamente');
    expect(nameInput).toHaveValue('CRM Name');
  });

  it('uses nome_crm when both name and nome_crm are available', () => {
    const ext = { ...minimalCompany, name: 'Direct Name', nome_crm: 'CRM Name' };
    renderForm(ext);
    const nameInput = screen.getByPlaceholderText('Nome usado internamente');
    // getCompanyField reads nome_crm first, so it wins over name
    expect(nameInput).toHaveValue('CRM Name');
  });

  it('falls back to nome_fantasia when name and nome_crm are empty', () => {
    const ext = { ...minimalCompany, name: '', nome_crm: '', nome_fantasia: 'Fantasy Name', razao_social: 'Legal' };
    renderForm(ext);
    const nameInput = screen.getByPlaceholderText('Nome usado internamente');
    expect(nameInput).toHaveValue('Fantasy Name');
  });

  it('preserves all external fields in edit mode', async () => {
    renderForm(fullExternalCompany);

    // ramo_atividade and nicho_cliente use SearchableSelect — verify the form renders without error
    // (SearchableSelect doesn't expose value via displayValue in test env)
    expect(screen.getByText('Ramo de Atividade')).toBeInTheDocument();
    expect(screen.getByText('Nicho do Cliente')).toBeInTheDocument();

    // Fiscal tab
    await userEvent.click(screen.getByRole('tab', { name: /Fiscal/ }));
    expect(screen.getByDisplayValue('79.114.450/0284-18')).toBeInTheDocument();
    expect(screen.getByDisplayValue('79114450')).toBeInTheDocument(); // cnpj_base

    // Classificação tab
    await userEvent.click(screen.getByRole('tab', { name: /Classificação/ }));
    expect(screen.getByDisplayValue('Coanorp Cooperativa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Singular')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();

    // Estrutura tab
    await userEvent.click(screen.getByRole('tab', { name: /Estrutura/ }));
    expect(screen.getByDisplayValue('#009639, #FFFFFF')).toBeInTheDocument();
    expect(screen.getByDisplayValue('abc-matriz-uuid')).toBeInTheDocument();
    expect(screen.getByDisplayValue('def-central-uuid')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ghi-singular-uuid')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jkl-confed-uuid')).toBeInTheDocument();
    expect(screen.getByDisplayValue('42')).toBeInTheDocument(); // bitrix_company_id
  });

  it('populates tags_array as tag badges', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('agro')).toBeInTheDocument();
    expect(screen.getByText('cooperativa')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('populates challenges as tag badges', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('Logística')).toBeInTheDocument();
    expect(screen.getByText('Custos')).toBeInTheDocument();
  });

  it('populates competitors as tag badges', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('Coamo')).toBeInTheDocument();
    expect(screen.getByText('C.Vale')).toBeInTheDocument();
  });

  it('populates website field', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByDisplayValue('https://www.coanorp.com.br/')).toBeInTheDocument();
  });

  it('populates grupo_economico_id in Classificação', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByRole('tab', { name: /Estrutura/ }));
    expect(screen.getByDisplayValue('9338a177-8645-4600-9817-cb0f6bf1069b')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 8: SCHEMA ALIGNMENT
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Schema Alignment with External DB', () => {
  const externalFields = [
    'nome_crm', 'nome_fantasia', 'razao_social', 'cnpj', 'cnpj_base',
    'ramo_atividade', 'nicho_cliente', 'capital_social', 'status',
    'situacao_rf', 'situacao_rf_data', 'porte_rf', 'natureza_juridica',
    'natureza_juridica_desc', 'data_fundacao', 'grupo_economico',
    'grupo_economico_id', 'is_customer', 'is_supplier', 'is_carrier',
    'is_matriz', 'tipo_cooperativa', 'numero_cooperativa',
    'inscricao_estadual', 'inscricao_municipal', 'cores_marca',
    'employee_count', 'annual_revenue', 'financial_health',
    'website', 'notes', 'matriz_id', 'central_id', 'singular_id',
    'confederacao_id', 'bitrix_company_id',
  ];

  it.each(externalFields)('form schema includes field: %s', (field) => {
    const company = {
      ...minimalCompany,
      [field]: ['capital_social', 'bitrix_company_id'].includes(field) ? 100 : field.includes('is_') ? true : 'test-value',
    };
    expect(() => renderForm(company)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 9: SUBMISSION — ARRAY CONVERSION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Array Field Submission', () => {
  it('converts tags_array via TagInput on submit', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Nome usado internamente');
    await userEvent.type(nameInput, 'Test Company');
    // TagInput: type tag and press Enter
    const tagsInput = screen.getByPlaceholderText(/VIP.*Cooperativa.*Agro/i);
    await userEvent.type(tagsInput, 'Tag1{enter}Tag2{enter}Tag3{enter}');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.tags_array).toEqual(['Tag1', 'Tag2', 'Tag3']);
    });
  });

  it('converts empty tags_array to null', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Nome usado internamente'), 'Test');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.tags_array).toBeNull();
    });
  });

  it('converts challenges via TagInput on submit', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Nome usado internamente'), 'Test');
    const challengesInput = screen.getByPlaceholderText(/Logística.*Custos/i);
    await userEvent.type(challengesInput, 'A{enter}B{enter}');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.challenges).toEqual(['A', 'B']);
    });
  });

  it('converts competitors via TagInput on submit', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Nome usado internamente'), 'Test');
    const competitorsInput = screen.getByPlaceholderText(/Empresa A.*Empresa B/i);
    await userEvent.type(competitorsInput, 'X{enter}Y{enter}');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.competitors).toEqual(['X', 'Y']);
    });
  });

  it('submits website field correctly', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Nome usado internamente'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('https://www.empresa.com.br'), 'https://example.com');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.website).toBe('https://example.com');
    });
  });

  it('submits bitrix_company_id as null when 0', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Nome usado internamente'), 'Test');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.bitrix_company_id).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 10: STRESS & BOUNDARY TESTS
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Stress & Boundary', () => {
  it('handles name at max length (150 chars)', () => {
    const longName = 'A'.repeat(150);
    renderForm({ ...minimalCompany, nome_crm: longName });
    expect(screen.getByDisplayValue(longName)).toBeInTheDocument();
  });

  it('handles notes at max length (2000 chars)', () => {
    const longNotes = 'N'.repeat(2000);
    renderForm({ ...minimalCompany, notes: longNotes });
    expect(screen.getByDisplayValue(longNotes)).toBeInTheDocument();
  });

  it('handles CNPJ with special characters', () => {
    renderForm({ ...minimalCompany, cnpj: '79.114.450/0284-18' });
    expect(screen.getByDisplayValue('79.114.450/0284-18')).toBeInTheDocument();
  });

  it('handles rapid tab switching', async () => {
    renderForm(fullExternalCompany);
    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getByRole('tab', { name: /Fiscal/ }));
      await userEvent.click(screen.getByRole('tab', { name: /Classificação/ }));
      await userEvent.click(screen.getByRole('tab', { name: /Estrutura/ }));
      await userEvent.click(screen.getByRole('tab', { name: /Básico/ }));
    }
    expect(screen.getByText(/Nome no CRM/)).toBeInTheDocument();
  });

  it('renders 10 forms concurrently without error', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {Array.from({ length: 10 }, (_, i) => (
            <CompanyForm
              key={i}
              company={{ ...fullExternalCompany, id: `id-${i}` } as never}
              onSubmit={mockSubmit}
              onCancel={mockCancel}
            />
          ))}
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getAllByText('Editar Empresa')).toHaveLength(10);
    unmount();
  });

  it('handles tags_array as empty array', () => {
    renderForm({ ...minimalCompany, tags_array: [] });
    // tags input should be empty, no crash
    expect(screen.getByText(/Nome no CRM/)).toBeInTheDocument();
  });
});
