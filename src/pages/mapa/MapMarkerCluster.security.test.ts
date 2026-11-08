import { describe, expect, it } from 'vitest';
import { createCompanyPopup } from './companyPopup';
import type { MappableCompany } from './MapMarkerCluster';

const company: MappableCompany = {
  id: 'empresa-1', name: 'Empresa', nome_crm: null, ramo_atividade: null, status: null,
  cnpj: null, email: null, phone: null, website: null, city: null, state: null,
  lat: -23, lng: -46, relationship_score: null,
};

describe('popup seguro do mapa', () => {
  it('mostra o cadastro como texto literal sem gerar elementos HTML', () => {
    const payload = '<img src=x onerror="alert(1)"><script>alert(1)</script>';
    const popup = createCompanyPopup({ ...company, nome_crm: payload, ramo_atividade: payload, city: payload, cnpj: payload, email: payload, phone: payload });
    expect(popup.textContent).toContain(payload);
    expect(popup.querySelector('img, script, iframe')).toBeNull();
    expect(popup.querySelector('[onerror], [onclick]')).toBeNull();
  });

  it.each(['javascript:alert(1)', 'data:text/html,teste', 'vbscript:teste', 'não-é-url'])('não cria link de protocolo inseguro: %s', website => {
    expect(createCompanyPopup({ ...company, website }).querySelector('a')).toBeNull();
  });

  it('mantém um link web seguro e distingue score zero de ausência', () => {
    const popup = createCompanyPopup({ ...company, website: 'https://example.test/?q=" onclick="alert(1)', relationship_score: 0 });
    const link = popup.querySelector('a');
    expect(link?.protocol).toBe('https:');
    expect(link?.rel).toBe('noopener noreferrer');
    expect(link?.getAttribute('onclick')).toBeNull();
    expect(popup.textContent).toContain('Score: 0/100');
    expect(createCompanyPopup(company).textContent).toContain('Não disponível');
  });
});
