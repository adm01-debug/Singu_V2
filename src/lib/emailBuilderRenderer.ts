import type { EmailBlock } from '@/components/email-builder/types';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') return u.toString();
  } catch {
    // ignore
  }
  return '#';
};

export function renderBlocksToHtml(blocks: EmailBlock[]): string {
  const inner = blocks.map(renderBlock).join('\n');
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Email</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;padding:32px;max-width:600px;">
        <tr><td>
${inner}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderBlocksToText(blocks: EmailBlock[]): string {
  return blocks.map(b => {
    switch (b.type) {
      case 'heading': return `\n${b.text}\n${'='.repeat(Math.min(b.text.length, 60))}\n`;
      case 'text': return `\n${b.text}\n`;
      case 'button': return `\n${b.label}: ${b.href}\n`;
      case 'image': return `[${b.alt || 'imagem'}]`;
      case 'divider': return `\n---\n`;
      case 'spacer': return '\n';
    }
  }).join('');
}

function renderBlock(b: EmailBlock): string {
  switch (b.type) {
    case 'heading': {
      const tag = `h${b.level}`;
      const size = b.level === 1 ? '28px' : b.level === 2 ? '22px' : '18px';
      return `<${tag} style="margin:0 0 12px;font-size:${size};line-height:1.3;text-align:${b.align};color:#0a0a0a;">${escape(b.text)}</${tag}>`;
    }
    case 'text':
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;text-align:${b.align};color:#333;">${escape(b.text).replace(/\n/g, '<br/>')}</p>`;
    case 'button': {
      const url = safeUrl(b.href);
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${b.align}" style="margin:16px auto;"><tr><td style="border-radius:6px;background:#4D96FF;"><a href="${url}" style="display:inline-block;padding:12px 24px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:6px;">${escape(b.label)}</a></td></tr></table>`;
    }
    case 'image': {
      const w = b.width ? `width="${b.width}"` : '';
      return `<img src="${escape(b.src)}" alt="${escape(b.alt || '')}" ${w} style="display:block;max-width:100%;height:auto;margin:12px 0;border-radius:6px;" />`;
    }
    case 'divider':
      return `<hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;" />`;
    case 'spacer':
      return `<div style="height:${b.height}px;line-height:${b.height}px;">&nbsp;</div>`;
  }
}
