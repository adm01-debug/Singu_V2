import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import type { IntelExportFormat } from '@/lib/intelExportUniversal';

interface ExportFormatMenuProps {
  onExport: (format: IntelExportFormat) => void;
  disabled?: boolean;
  label?: string;
}

const FORMATS: Array<{ value: IntelExportFormat; label: string; desc: string }> = [
  { value: 'csv', label: 'CSV', desc: 'Excel · BOM' },
  { value: 'tsv', label: 'TSV', desc: 'Tab-separated' },
  { value: 'json', label: 'JSON', desc: 'Estruturado' },
  { value: 'markdown', label: 'MARKDOWN', desc: 'Tabela MD' },
];

/**
 * Botão dropdown estilizado em terminal para escolher formato de export.
 */
export const ExportFormatMenu = ({ onExport, disabled, label = 'EXPORT' }: ExportFormatMenuProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="h-7 px-2 inline-flex items-center gap-1.5 intel-mono text-[10px] uppercase border border-border rounded-sm hover:border-[hsl(var(--intel-accent))] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Escolher formato de export"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="h-3 w-3" aria-hidden /> {label}
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
      </button>
      {open && !disabled && (
        <div
          role="menu"
          className="absolute right-0 mt-1 z-30 min-w-[160px] intel-card bg-[hsl(var(--intel-surface-1))] p-1"
        >
          {FORMATS.map((f) => (
            <button
              key={f.value}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                onExport(f.value);
              }}
              className="w-full text-left intel-mono text-[11px] px-2 py-1 rounded-sm hover:bg-[hsl(var(--intel-accent)/0.15)] flex items-center justify-between gap-2"
            >
              <span className="text-foreground">{f.label}</span>
              <span className="text-[10px] text-muted-foreground">{f.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
