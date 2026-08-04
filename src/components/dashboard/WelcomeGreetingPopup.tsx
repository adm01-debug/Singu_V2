import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sun, Moon, Sunset, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

function formatDisplayName(raw: string): string {
  const cleaned = raw.replace(/[0-9_\-.]+/g, ' ').trim();
  if (!cleaned || cleaned.length < 4) return '';
  const techPatterns = /^(adm|usr|admin|test|user|dev|root|sys|tmp|info|noreply|contato|suporte|equipe|vendas|sac)$/i;
  if (techPatterns.test(cleaned)) return '';
  const vowelCount = (cleaned.match(/[aeiouáéíóúâêîôûãõ]/gi) || []).length;
  if (vowelCount < 2) return '';
  return cleaned
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function WelcomeGreetingPopup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.first_name) {
          const name = formatDisplayName(data.first_name);
          if (name) setProfileName(name);
        }
      });
  }, [user?.id]);

  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const hour = new Date().getHours();
  const rawName = user?.user_metadata?.first_name
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.display_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';
  const metadataName = formatDisplayName(rawName);
  const firstName = profileName || metadataName;

  let greeting: string;
  let GreetingIcon: typeof Sun;
  if (hour < 12) { greeting = 'Bom dia'; GreetingIcon = Sun; }
  else if (hour < 18) { greeting = 'Boa tarde'; GreetingIcon = Sunset; }
  else { greeting = 'Boa noite'; GreetingIcon = Moon; }

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date());
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1).toLowerCase();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-6 right-6 z-[100] w-auto max-w-sm"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-primary/25 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-[0_16px_48px_-16px_hsl(var(--primary)/0.35)]">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-nexus-cyan to-accent flex items-center justify-center shrink-0 ring-1 ring-primary/30">
              <GreetingIcon className="w-5 h-5 text-primary-foreground" />
            </div>

            {/* Text */}
            <div className="pr-6">
              <p className="text-sm md:text-base font-bold text-foreground leading-tight">
                {firstName ? `${greeting}, ${firstName}` : `${greeting}! ✨`}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-2 right-2 p-1 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
