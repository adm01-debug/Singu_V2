import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function useWebAuthn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  const isSupported = typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['webauthn-credentials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) return [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && isSupported,
    staleTime: 5 * 60_000,
  });

  const register = useCallback(async (label?: string) => {
    if (!user || !isSupported) return false;
    setIsRegistering(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'SINGU CRM', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email ?? 'user',
            displayName: user.user_metadata?.first_name ?? user.email ?? 'Usuário',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) throw new Error('Registro cancelado');
      const response = credential.response as AuthenticatorAttestationResponse;

      const { error } = await supabase.from('webauthn_credentials').insert({
        user_id: user.id,
        credential_id: bufferToBase64(credential.rawId),
        public_key: bufferToBase64(response.getPublicKey()!),
        label: label ?? 'Passkey',
        transports: response.getTransports?.() ?? [],
      });
      if (error) throw error;
      toast.success('Passkey registrada com sucesso!');
      qc.invalidateQueries({ queryKey: ['webauthn-credentials'] });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar passkey';
      toast.error(msg);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [user, isSupported, qc]);

  const remove = useCallback(async (credentialId: string) => {
    const { error } = await supabase.from('webauthn_credentials').delete().eq('id', credentialId);
    if (error) { toast.error('Erro ao remover passkey.'); return; }
    toast.success('Passkey removida.');
    qc.invalidateQueries({ queryKey: ['webauthn-credentials'] });
  }, [qc]);

  return { isSupported, credentials, isLoading, isRegistering, register, remove };
}
