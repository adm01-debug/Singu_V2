import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';
import { User, Palette, Bell, Shield, Save, Camera, Brain, GraduationCap, FileText, Smartphone, Settings2, Sparkles } from 'lucide-react';
import { ProntidaoDefaultsSection } from '@/components/settings/ProntidaoDefaultsSection';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAccessibleToast } from '@/hooks/useAccessibleToast';
import { SalespersonProfileSettings } from '@/components/triggers/SalespersonProfileSettings';
import { CommunicationTrainingMode } from '@/components/triggers/CommunicationTrainingMode';
import { WeeklyReportPanel } from '@/components/dashboard/WeeklyReportPanel';
import { TourPreferencesPanel } from '@/components/settings/TourPreferencesPanel';
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { ConfigNotificationsTab } from './configuracoes/ConfigNotificationsTab';
import { ConfigSecurityTab } from './configuracoes/ConfigSecurityTab';
import { logger } from "@/lib/logger";

interface ProfileData {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

const Configuracoes = () => {
  usePageTitle('Configurações');
  const { user } = useAuth();
  useTheme();
  const accessibleToast = useAccessibleToast();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ first_name: '', last_name: '', avatar_url: null });
  const [notifications, setNotifications] = useState({
    emailNotifications: true, pushNotifications: false, weeklyDigest: true, interactionReminders: true,
  });

  useUnsavedChangesGuard(hasUnsavedChanges);

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', user.id).maybeSingle();
      if (data && !error) setProfile({ first_name: data.first_name || '', last_name: data.last_name || '', avatar_url: data.avatar_url });
    } catch (error) { 
      const msg = error instanceof Error ? error.message : 'Erro ao buscar perfil';
      logger.error('Error fetching profile:', { error: msg }); 
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ first_name: profile.first_name, last_name: profile.last_name }).eq('id', user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { first_name: profile.first_name, last_name: profile.last_name } });
      setHasUnsavedChanges(false);
      accessibleToast.success('Perfil atualizado com sucesso!');
    } catch (error) { 
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      accessibleToast.error(msg); 
    }
    finally { setLoading(false); }
  };

  const userInitials = profile.first_name && profile.last_name
    ? `${(profile.first_name || '')[0] || 'U'}${(profile.last_name || '')[0] || ''}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <AppLayout>
      <SEOHead title="Configurações" description="Preferências e configurações do sistema" />
      <Header title="Configurações" subtitle="Gerencie seu perfil, preferências e configurações do sistema" hideBack />
      
      <div className="p-6 space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Perfil</TabsTrigger>
            <TabsTrigger value="nlp" className="gap-2"><Brain className="w-4 h-4" />Meu PNL</TabsTrigger>
            <TabsTrigger value="training" className="gap-2"><GraduationCap className="w-4 h-4" />Treinamento</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4" />Relatórios</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" />Aparência</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" />Notificações</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" />Segurança</TabsTrigger>
            <TabsTrigger value="app" className="gap-2"><Smartphone className="w-4 h-4" />App</TabsTrigger>
            <TabsTrigger value="custom-fields" className="gap-2"><Settings2 className="w-4 h-4" />Campos</TabsTrigger>
            <TabsTrigger value="score" className="gap-2"><Sparkles className="w-4 h-4" />Score</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Informações do Perfil</CardTitle>
                  <CardDescription>Atualize suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <OptimizedAvatar src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} fallback={userInitials} size="xl" className="border-4 border-primary/20" />
                      <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"><Camera className="w-4 h-4" /></button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : 'Seu Nome'}</h3>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Membro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nome</Label>
                      <Input id="first_name" value={profile.first_name} onChange={(e) => { setProfile({ ...profile, first_name: e.target.value }); setHasUnsavedChanges(true); }} placeholder="Seu nome" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input id="last_name" value={profile.last_name} onChange={(e) => { setProfile({ ...profile, last_name: e.target.value }); setHasUnsavedChanges(true); }} placeholder="Seu sobrenome" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading} className="gap-2"><Save className="w-4 h-4" />{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="nlp"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><SalespersonProfileSettings /></motion.div></TabsContent>
          <TabsContent value="training"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><CommunicationTrainingMode /></motion.div></TabsContent>
          <TabsContent value="reports"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><WeeklyReportPanel /></motion.div></TabsContent>
          <TabsContent value="appearance"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6"><ThemeCustomizer /></motion.div></TabsContent>
          <TabsContent value="notifications"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><ConfigNotificationsTab notifications={notifications} onChange={setNotifications} /></motion.div></TabsContent>
          <TabsContent value="security"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><ConfigSecurityTab /></motion.div></TabsContent>
          <TabsContent value="app"><TourPreferencesPanel /></TabsContent>
          <TabsContent value="custom-fields"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4"><CustomFieldsManager entityType="contact" /><CustomFieldsManager entityType="company" /><CustomFieldsManager entityType="deal" /></motion.div></TabsContent>
          <TabsContent value="score"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><ProntidaoDefaultsSection /></motion.div></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
