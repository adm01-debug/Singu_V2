// ==============================================
// DISC Compatibility Alerts - Proactive Notifications
// Enterprise Level Component
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, Bell, BellOff, Settings, Check,
  X, Zap,
  Shield, RefreshCw, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { DISCProfile } from '@/types';
import { DISC_PROFILES, getCompatibility } from '@/data/discAdvancedData';
import { logger } from "@/lib/logger";

interface CompatibilityAlert {
  id: string;
  contactId: string;
  contactName: string;
  contactProfile: Exclude<DISCProfile, null>;
  sellerProfile: Exclude<DISCProfile, null>;
  compatibilityScore: number;
  challenges: string[];
  tips: string[];
  createdAt: Date;
  dismissed: boolean;
}

interface AlertSettings {
  enabled: boolean;
  threshold: number;
  emailNotifications: boolean;
  onlyImportantContacts: boolean;
  importantMinScore: number;
}

interface DISCCompatibilityAlertsProps {
  compact?: boolean;
  maxItems?: number;
  className?: string;
}

const DISCCompatibilityAlerts: React.FC<DISCCompatibilityAlertsProps> = ({ 
  compact = false, 
  maxItems = 10,
  className 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<CompatibilityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: true,
    threshold: 50,
    emailNotifications: false,
    onlyImportantContacts: false,
    importantMinScore: 70
  });

  const sellerProfile: Exclude<DISCProfile, null> = (() => {
    try {
      const stored = localStorage.getItem('singu-seller-disc-profile');
      if (stored && ['D', 'I', 'S', 'C'].includes(stored)) return stored as Exclude<DISCProfile, null>;
    } catch { /* fallback */ }
    return 'I';
  })();

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch contacts with DISC profiles
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, behavior, relationship_score')
        .order('relationship_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      const newAlerts: CompatibilityAlert[] = [];

      (contacts || []).forEach(contact => {
        const behavior = contact.behavior as Record<string, unknown> | null;
        const contactProfile = (behavior?.discProfile || behavior?.disc) as Exclude<DISCProfile, null> | undefined;
        
        if (!contactProfile) return;

        const compatibility = getCompatibility(sellerProfile, contactProfile);
        if (!compatibility) return;

        // Only alert if below threshold
        if (compatibility.score >= settings.threshold) return;

        // Filter by important contacts if enabled
        if (settings.onlyImportantContacts && (contact.relationship_score || 0) < settings.importantMinScore) {
          return;
        }

        newAlerts.push({
          id: `alert-${contact.id}`,
          contactId: contact.id,
          contactName: `${contact.first_name} ${contact.last_name}`,
          contactProfile,
          sellerProfile,
          compatibilityScore: compatibility.score,
          challenges: compatibility.challenges || [],
          tips: compatibility.tips || [],
          createdAt: new Date(),
          dismissed: false
        });
      });

      // Sort by compatibility score (lowest first)
      newAlerts.sort((a, b) => a.compatibilityScore - b.compatibilityScore);

      setAlerts(newAlerts.slice(0, maxItems));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Error fetching compatibility alerts:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user, sellerProfile, settings.threshold, settings.onlyImportantContacts, settings.importantMinScore, maxItems]);

  useEffect(() => {
    if (settings.enabled) {
      fetchAlerts();
    }
  }, [settings.enabled, fetchAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast({
      title: 'Alerta dispensado',
      description: 'Você pode configurar os limiares nas configurações'
    });
  }, [toast]);

  const getScoreBadge = (score: number) => {
    if (score >= 70) return 'bg-success/10 text-success border-success/30';
    if (score >= 50) return 'bg-warning/10 text-warning border-warning/30';
    return 'bg-destructive/10 text-destructive border-destructive/30';
  };

  if (!settings.enabled) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <BellOff className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium mb-2">Alertas Desativados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ative os alertas de compatibilidade para receber notificações proativas
          </p>
          <Button onClick={() => setSettings(s => ({ ...s, enabled: true }))}>
            <Bell className="w-4 h-4 mr-2" />
            Ativar Alertas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <CardTitle className="text-lg">Alertas de Compatibilidade</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{alerts.length} alertas</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAlerts}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Contatos com baixa compatibilidade DISC que precisam de atenção
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/30 rounded-lg p-4 space-y-4"
            >
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações de Alertas
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Alertas ativos</Label>
                  <Switch
                    id="enabled"
                    checked={settings.enabled}
                    onCheckedChange={(enabled) => setSettings(s => ({ ...s, enabled }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Limiar de compatibilidade</Label>
                    <span className="text-sm font-mono">{settings.threshold}%</span>
                  </div>
                  <Slider
                    value={[settings.threshold]}
                    onValueChange={([threshold]) => setSettings(s => ({ ...s, threshold }))}
                    min={20}
                    max={80}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alertas para contatos com compatibilidade abaixo de {settings.threshold}%
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="important">Apenas contatos importantes</Label>
                  <Switch
                    id="important"
                    checked={settings.onlyImportantContacts}
                    onCheckedChange={(onlyImportantContacts) => 
                      setSettings(s => ({ ...s, onlyImportantContacts }))
                    }
                  />
                </div>

                {settings.onlyImportantContacts && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Score mínimo de relacionamento</Label>
                      <span className="text-sm font-mono">{settings.importantMinScore}</span>
                    </div>
                    <Slider
                      value={[settings.importantMinScore]}
                      onValueChange={([importantMinScore]) => 
                        setSettings(s => ({ ...s, importantMinScore }))
                      }
                      min={50}
                      max={90}
                      step={5}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(false)}
                className="w-full"
              >
                Fechar Configurações
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-success/50" />
            <h3 className="font-medium mb-2">Tudo Sob Controle</h3>
            <p className="text-sm text-muted-foreground">
              Nenhum contato com compatibilidade crítica detectado
            </p>
          </div>
        ) : (
          <ScrollArea className={compact ? "max-h-[200px] pr-2" : "h-[400px] pr-2"}>
            <div className="space-y-3">
              {alerts.map((alert, idx) => {
                const profileInfo = DISC_PROFILES[alert.contactProfile];
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-muted/30 rounded-lg p-4 border ${getScoreBadge(alert.compatibilityScore)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            to={`/contatos/${alert.contactId}`}
                            className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {alert.contactName}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <Badge 
                            style={{ 
                              backgroundColor: profileInfo?.color?.bg,
                              color: profileInfo?.color?.text
                            }}
                          >
                            {alert.contactProfile}
                          </Badge>
                          <Badge variant="outline" className={getScoreBadge(alert.compatibilityScore)}>
                            {alert.compatibilityScore}% compatível
                          </Badge>
                        </div>

                        {/* Challenges */}
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            Desafios:
                          </span>
                          <ul className="text-sm space-y-0.5">
                            {alert.challenges.slice(0, 2).map((challenge, i) => (
                              <li key={i} className="flex items-center gap-1 text-muted-foreground">
                                <X className="w-3 h-3 text-destructive" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tips */}
                        <div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Zap className="w-3 h-3" />
                            Dicas:
                          </span>
                          <ul className="text-sm space-y-0.5">
                            {alert.tips.slice(0, 2).map((tip, i) => (
                              <li key={i} className="flex items-center gap-1 text-muted-foreground">
                                <Check className="w-3 h-3 text-success" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissAlert(alert.id)}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default DISCCompatibilityAlerts;
