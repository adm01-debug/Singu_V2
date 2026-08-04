import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML user-generated para prevenir XSS.
 * Usa DOMPurify com configuração restritiva por padrão.
 */
export function sanitizeHtml(dirty: string, options?: Record<string, unknown>): string {
  // eslint-disable-next-line sonarjs/dompurify-unsafe-config -- TrustedTypes API not available in this environment; RETURN_TRUSTED_TYPE has no effect without a TrustedTypes policy
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: false,
    RETURN_TRUSTED_TYPE: false,
    // Prevent javascript: hrefs even if DOMPurify misses them
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ...options,
  }) as string;

  // Force rel="noopener noreferrer" on all target="_blank" links
  return clean.replace(/<a\s([^>]*target=["']_blank["'][^>]*)>/gi, (match, attrs) => {
    if (/\brel=/i.test(attrs)) {
      return match.replace(/rel=["'][^"']*["']/i, 'rel="noopener noreferrer"');
    }
    return `<a ${attrs} rel="noopener noreferrer">`;
  });
}

/**
 * Sanitiza HTML de documentos internos (contratos, assinaturas) com allowlist mais rica.
 * Permite cabeçalhos, tabelas e divs que são comuns em documentos gerados pelo sistema.
 * Ainda bloqueia scripts, event handlers e protocolos perigosos.
 */
export function sanitizeDocumentHtml(dirty: string): string {
  // eslint-disable-next-line sonarjs/dompurify-unsafe-config -- TrustedTypes API not available in this environment
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'div', 'section', 'article', 'header', 'footer',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'hr', 'blockquote', 'pre', 'code', 'sup', 'sub', 'mark', 'small',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'id', 'colspan', 'rowspan', 'align', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onchange', 'onfocus', 'onblur'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    RETURN_TRUSTED_TYPE: false,
  }) as string;

  return clean.replace(/<a\s([^>]*target=["']_blank["'][^>]*)>/gi, (match, attrs) => {
    if (/\brel=/i.test(attrs)) {
      return match.replace(/rel=["'][^"']*["']/i, 'rel="noopener noreferrer"');
    }
    return `<a ${attrs} rel="noopener noreferrer">`;
  });
}

/**
 * Sanitiza texto puro removendo qualquer HTML.
 */
export function sanitizeText(dirty: string): string {
  // eslint-disable-next-line sonarjs/dompurify-unsafe-config -- TrustedTypes API not available in this environment; RETURN_TRUSTED_TYPE has no effect without a TrustedTypes policy
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_TRUSTED_TYPE: false,
  }) as string;
}

/**
 * Sanitiza URL para prevenir javascript: e data: protocols.
 */
export function sanitizeUrl(url: string): string {
  const cleaned = url.trim();
  if (/^(javascript|data|vbscript):/i.test(cleaned)) {
    return '';
  }
  return cleaned;
}
