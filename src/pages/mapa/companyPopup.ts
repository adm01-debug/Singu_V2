import type { MappableCompany } from './MapMarkerCluster';

export function createCompanyPopup(company: MappableCompany): HTMLElement {
  const popup = document.createElement('div');
  popup.style.cssText = 'min-width:240px;font-size:12px;font-family:system-ui';
  const addText = (text: string, style = 'margin:2px 0') => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    paragraph.style.cssText = style;
    popup.append(paragraph);
    return paragraph;
  };
  addText(company.nome_crm || company.name, 'font-weight:700;font-size:14px;margin:0 0 4px');
  if (company.ramo_atividade) addText(`🏢 ${company.ramo_atividade}`, 'color:#888;margin:2px 0');
  const location = [company.city, company.state].filter(Boolean).join(', ');
  if (location) addText(`📍 ${location}`);
  if (company.cnpj) addText(`📋 ${company.cnpj}`);
  if (company.email) addText(`✉️ ${company.email}`);
  if (company.phone) addText(`📞 ${company.phone}`);
  if (company.website) {
    try {
      const website = new URL(company.website);
      if (website.protocol === 'http:' || website.protocol === 'https:') {
        const link = document.createElement('a');
        link.href = website.href;
        link.textContent = company.website.replace(/https?:\/\//i, '').slice(0, 30);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        addText('🌐 ').append(link);
      }
    } catch { /* URL inválida */ }
  }
  const scoreColor = company.relationship_score === null ? '#888' : company.relationship_score >= 60 ? '#22c55e' : company.relationship_score >= 30 ? '#eab308' : '#ef4444';
  const score = company.relationship_score === null ? 'Não disponível' : `${company.relationship_score}/100`;
  addText(`Score: ${score}`, `border-top:1px solid #ddd;margin-top:6px;padding-top:4px;font-weight:700;color:${scoreColor}`);
  return popup;
}
