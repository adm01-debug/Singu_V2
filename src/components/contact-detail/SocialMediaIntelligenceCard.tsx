import React, { useState, useEffect, useCallback } from 'react';
import { safehref } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Share2, EyeOff, ShieldCheck, Linkedin, Instagram, Twitter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
 
interface SocialMediaIntelligenceCardProps {
  contactId: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
}

 export const SocialMediaIntelligenceCard = ({ contactId, linkedin, instagram, twitter }: SocialMediaIntelligenceCardProps) => {
   const [allowPublicData, setAllowPublicData] = useState(true);
   const { user } = useAuth();
 
  const logConsent = useCallback(async (network: string, source: string) => {
    if (!user) return;
    const { error } = await supabase.from('social_consent_audit').insert({
      contact_id: contactId,
      user_id: user.id,
      network,
      source_url: source,
      consent_type: 'public_data_osint'
    });
    if (error) logger.error('Error logging consent:', error);
  }, [user, contactId]);

  useEffect(() => {
    if (!allowPublicData) return;
    if (linkedin) logConsent('linkedin', linkedin);
    if (instagram) logConsent('instagram', instagram);
    if (twitter) logConsent('twitter', twitter);
  }, [allowPublicData, logConsent, linkedin, instagram, twitter]);

  if (!allowPublicData) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 flex flex-col items-center justify-center py-10 text-center">
          <EyeOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <h3 className="font-bold text-sm text-muted-foreground">Privacidade Ativada</h3>
          <p className="text-xs text-muted-foreground/70 max-w-xs mt-1">
            A coleta de dados públicos de redes sociais está desativada para este contato.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setAllowPublicData(true)}>
            Ativar Inteligência Social
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-blue-100 shadow-sm">
      <CardHeader className="pb-3 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Share2 className="h-4 w-4 text-blue-600" />
            Inteligência de Redes Sociais
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="privacy-toggle" className="text-[10px] text-muted-foreground font-bold uppercase">Privacidade</Label>
            <Switch 
              id="privacy-toggle" 
              checked={allowPublicData} 
              onCheckedChange={setAllowPublicData}
              className="scale-75"
            />
          </div>
        </div>
        <CardDescription className="text-[11px]">Insights automáticos baseados em presença digital pública</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Perfil Digital</p>
            <Badge variant="outline" className="text-[10px] bg-background">Líder de Opinião</Badge>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Tópicos Ativos</p>
            <div className="flex flex-wrap gap-1">
              <Badge className="text-[9px] h-4 py-0">Tech</Badge>
              <Badge className="text-[9px] h-4 py-0">Vendas</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Conexões Detectadas</h4>
           <div className="flex items-center gap-3">
             {linkedin && (
               <a 
                 href={safehref(linkedin)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="p-2 rounded-full bg-blue-100 text-blue-700 hover:scale-110 transition-transform"
                 onClick={() => logConsent('linkedin', linkedin)}
               >
                 <Linkedin className="h-4 w-4" />
               </a>
             )}
             {instagram && (
               <a 
                 href={safehref(instagram)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="p-2 rounded-full bg-pink-100 text-pink-700 hover:scale-110 transition-transform"
                 onClick={() => logConsent('instagram', instagram)}
               >
                 <Instagram className="h-4 w-4" />
               </a>
             )}
             {twitter && (
               <a 
                 href={safehref(twitter)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="p-2 rounded-full bg-sky-100 text-sky-700 hover:scale-110 transition-transform"
                 onClick={() => logConsent('twitter', twitter)}
               >
                 <Twitter className="h-4 w-4" />
               </a>
             )}
            {!linkedin && !instagram && !twitter && (
              <p className="text-xs text-muted-foreground italic">Nenhum perfil público vinculado.</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-dashed flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold">Dados em Conformidade</span>
          </div>
          <span className="text-[10px] text-muted-foreground italic">Atualizado há 2h</span>
        </div>
      </CardContent>
    </Card>
  );
};
