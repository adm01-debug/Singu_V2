import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Heart,
  Shield,
  Target,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { getDominantVAK, getDISCProfile } from '@/lib/contact-utils';
import { toast } from '@/hooks/use-toast';
import { DEMO_CONTACT } from '@/domain/demoEntities';
import { EMOTIONAL_STATES_DATA } from '@/data/stateElicitationData';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Clock: <Clock className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
};

interface StateElicitationToolkitProps {
  contact?: Contact;
  className?: string;
}

const EMOTIONAL_STATES = EMOTIONAL_STATES_DATA.map(s => ({
  ...s,
  icon: ICON_MAP[s.iconName] || <Sparkles className="h-5 w-5" />,
}));


const StateElicitationToolkit: React.FC<StateElicitationToolkitProps> = ({
  contact,
  className
}) => {
  const activeContact = contact || DEMO_CONTACT;
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const vakType = getDominantVAK(activeContact) as VAKType || 'V';
  const discProfile = (getDISCProfile(activeContact) as DISCProfile) || 'D';

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script)
      .then(() => {
        setCopiedScript(script);
        setTimeout(() => setCopiedScript(null), 2000);
        toast({ title: "Copiado!", description: "Script de eliciação copiado" });
      })
      .catch(() => toast({ title: "Erro", description: "Não foi possível copiar", variant: "destructive" }));
  };

  const getStateScripts = (state: typeof EMOTIONAL_STATES[number]) => {
    const vakScripts = state.scripts.vak[vakType] || state.scripts.vak['V'];
    const discScripts = state.scripts.disc[discProfile] || [];
    return { vakScripts, discScripts };
  };

  return (
    <Card className={cn("border-primary/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            State Elicitation Toolkit
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/20">
              VAK: {vakType}
            </Badge>
            <Badge variant="outline" className="bg-secondary/20">
              DISC: {discProfile}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Scripts para eliciar estados emocionais específicos em {activeContact.firstName}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* State Selector */}
        <div className="grid grid-cols-5 gap-1">
          {EMOTIONAL_STATES.map(state => (
            <button
              key={state.id}
              onClick={() => setSelectedState(selectedState === state.id ? null : state.id)}
              className={cn(
                "p-2 rounded-lg border text-center transition-all",
                selectedState === state.id 
                  ? 'bg-primary/20 border-primary/50' 
                  : 'bg-muted/30 border-transparent hover:bg-muted/50'
              )}
            >
              <div className={cn("flex justify-center mb-1", state.color)}>
                {state.icon}
              </div>
              <div className="text-[10px] font-medium truncate">{state.name}</div>
            </button>
          ))}
        </div>

        {/* Selected State Details */}
        <AnimatePresence mode="wait">
          {selectedState && (
            <motion.div
              key={selectedState}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {(() => {
                const state = EMOTIONAL_STATES.find(s => s.id === selectedState)!;
                const { vakScripts, discScripts } = getStateScripts(state);
                
                return (
                  <>
                    <div className={cn("bg-muted/30 rounded-lg p-3 border-l-4", `border-l-${state.color.replace('text-', '')}`)} style={{ borderLeftColor: state.color.includes('purple') ? '#a855f7' : state.color.includes('blue') ? '#60a5fa' : state.color.includes('orange') ? '#fb923c' : state.color.includes('pink') ? '#f472b6' : '#4ade80' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={state.color}>{state.icon}</span>
                        <span className="font-medium">{state.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{state.description}</p>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Quando usar:</span>{' '}
                        <span>{state.useCase}</span>
                      </div>
                    </div>

                    {/* VAK Adapted Scripts */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Scripts adaptados para {vakType} ({vakType === 'V' ? 'Visual' : vakType === 'A' ? 'Auditivo' : vakType === 'K' ? 'Cinestésico' : 'Digital'}):
                      </div>
                      {vakScripts.map((script, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => copyScript(script)}
                          className="w-full text-left bg-primary/10 rounded p-2 text-sm hover:bg-primary/20 transition-colors flex items-center justify-between group border border-primary/20"
                        >
                          <span className="italic">"{script}"</span>
                          {copiedScript === script ? (
                            <Check className="h-3 w-3 text-success shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* DISC Adapted Scripts */}
                    {discScripts.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Reforço para perfil {discProfile}:
                        </div>
                        {discScripts.map((script, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => copyScript(script)}
                            className="w-full text-left bg-secondary/10 rounded p-2 text-sm hover:bg-secondary/20 transition-colors flex items-center justify-between group border border-secondary/20"
                          >
                            <span className="italic">"{script}"</span>
                            {copiedScript === script ? (
                              <Check className="h-3 w-3 text-success shrink-0" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Guide */}
        <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
          <strong className="text-primary">💡 Dica de Eliciação:</strong>{' '}
          Para {activeContact.firstName} ({vakType}/{discProfile}), comece com{' '}
          <span className="text-primary">
            {vakType === 'V' ? 'imagens e visualizações' : 
             vakType === 'A' ? 'sons e descrições verbais' :
             vakType === 'K' ? 'sensações e experiências' :
             'dados e lógica'}
          </span> e adapte o ritmo para{' '}
          <span className="text-secondary">
            {discProfile === 'D' ? 'direto e rápido' :
             discProfile === 'I' ? 'entusiasta e social' :
             discProfile === 'S' ? 'calmo e seguro' :
             'detalhado e preciso'}
          </span>.
        </div>
      </CardContent>
    </Card>
  );
};

export default StateElicitationToolkit;
