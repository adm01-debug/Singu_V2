import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ContactAvatarUploadProps {
  avatarUrl?: string | null;
  onAvatarChange: (url: string | null) => void;
  contactId?: string;
}

export function ContactAvatarUpload({ avatarUrl, onAvatarChange, contactId }: ContactAvatarUploadProps) {
  const { user } = useAuth();
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
      if (!user) { toast.error('Usuário não autenticado'); return; }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/${contactId || crypto.randomUUID()}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('contact-avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('contact-avatars')
        .getPublicUrl(path);

      onAvatarChange(data.publicUrl);
      toast.success('Foto atualizada!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Avatar upload error:', { error: msg });
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [contactId, onAvatarChange]);

  const handleRemove = useCallback(() => {
    onAvatarChange(null);
  }, [onAvatarChange]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'relative w-16 h-16 rounded-full border-2 border-dashed border-border',
          'flex items-center justify-center overflow-hidden',
          'hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : avatarUrl ? (
          <>
            <img
              src={avatarUrl}
              alt="Foto do contato"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <span
              role="button"
              tabIndex={0}
              aria-label="Remover foto"
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
      <span className="text-[10px] text-muted-foreground">Foto</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        aria-label="Upload foto do contato"
      />
    </div>
  );
}
