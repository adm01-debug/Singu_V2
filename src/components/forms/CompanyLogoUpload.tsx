import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface CompanyLogoUploadProps {
  logoUrl?: string | null;
  onLogoChange: (url: string | null) => void;
  companyId?: string;
}

export function CompanyLogoUpload({ logoUrl, onLogoChange, companyId }: CompanyLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Usuário não autenticado'); return; }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/${companyId || crypto.randomUUID()}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(path);

      onLogoChange(data.publicUrl);
      toast.success('Logo atualizado!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Upload error:', { error: msg });
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [companyId, onLogoChange]);

  const handleRemove = useCallback(() => {
    onLogoChange(null);
  }, [onLogoChange]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'relative w-16 h-16 rounded-xl border-2 border-dashed border-border',
          'flex items-center justify-center overflow-hidden',
          'hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt="Logo da empresa"
              className="w-full h-full object-contain p-1"
            />
            <span
              role="button"
              tabIndex={0}
              aria-label="Remover logo"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleRemove(); } }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-3 h-3" />
            </span>
          </>
        ) : (
          <ImagePlus className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      <span className="text-[10px] text-muted-foreground">Logo</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        aria-label="Upload logo da empresa"
      />
    </div>
  );
}
