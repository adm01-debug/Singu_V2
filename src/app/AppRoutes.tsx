import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { PageLoadingFallback } from '@/components/feedback/PageLoadingFallback';
import { useWebVitals } from '@/hooks/useWebVitals';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useCircuitBreakerHandler } from '@/hooks/useCircuitBreakerHandler';
import { useViewTransitions } from '@/hooks/useViewTransitions';
import {
  ContactsPageSkeleton,
  CompaniesPageSkeleton,
  InteractionsPageSkeleton,
  AnalyticsPageSkeleton,
  InsightsPageSkeleton,
  CalendarPageSkeleton,
  SettingsPageSkeleton,
  NetworkPageSkeleton,
} from '@/components/skeletons/PageSkeletons';
import Index from '@/pages/Index';
import * as P from './lazyPages';

/** Suspense + ErrorBoundary wrapper for lazy routes */
const LazyPage = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <Suspense fallback={fallback || <PageLoadingFallback />}>{children}</Suspense>
  </ErrorBoundary>
);

const Protected = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RequireAuth>
    <LazyPage fallback={fallback}>{children}</LazyPage>
  </RequireAuth>
);

const Admin = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <LazyPage>
      <P.RequireAdminLazy>{children}</P.RequireAdminLazy>
    </LazyPage>
  </RequireAuth>
);

export const AppRoutes = () => {
  useWebVitals();
  useViewTransitions();
  useOnlineStatus({
    onOffline: () => import('sonner').then(m => m.toast.warning('Conexão perdida', { description: 'Você está offline.' })),
    onOnline: () => import('sonner').then(m => m.toast.success('Conexão restaurada')),
  });
  useCircuitBreakerHandler();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<LazyPage><P.Auth /></LazyPage>} />
      <Route path="/survey/:token" element={<LazyPage><P.PublicSurvey /></LazyPage>} />
      <Route path="/lp/:slug" element={<LazyPage><P.PublicLandingPage /></LazyPage>} />
      <Route path="/f/:slug" element={<LazyPage><P.PublicForm /></LazyPage>} />
      <Route path="/lm/:slug" element={<LazyPage><P.PublicLeadMagnet /></LazyPage>} />
      <Route path="/dr/:token" element={<LazyPage><P.PublicDealRoomPage /></LazyPage>} />
      <Route path="/signature/:token" element={<LazyPage><P.PublicSignaturePage /></LazyPage>} />
      <Route path="/status" element={<LazyPage><P.StatusPage /></LazyPage>} />
      <Route path="/design-system" element={<LazyPage><P.DesignSystem /></LazyPage>} />
      <Route path="/reset-password" element={<LazyPage><P.ResetPassword /></LazyPage>} />
      <Route path="/sso/callback" element={<LazyPage><P.SSOCallbackPage /></LazyPage>} />
      <Route path="/onboarding" element={<Protected><P.Onboarding /></Protected>} />

      {/* Protected — core */}
      <Route path="/" element={<Protected><Index /></Protected>} />
      <Route path="/empresas" element={<Protected fallback={<CompaniesPageSkeleton />}><P.Empresas /></Protected>} />
      <Route path="/empresas/:id" element={<Protected fallback={<CompaniesPageSkeleton />}><P.EmpresaDetalhe /></Protected>} />
      <Route path="/contatos" element={<Protected fallback={<ContactsPageSkeleton />}><P.Contatos /></Protected>} />
      <Route path="/contatos/:id" element={<Protected fallback={<ContactsPageSkeleton />}><P.ContatoDetalhe /></Protected>} />
      <Route path="/contatos/:id/ficha-360" element={<Protected fallback={<ContactsPageSkeleton />}><P.Ficha360 /></Protected>} />
      <Route path="/interacoes" element={<Protected fallback={<InteractionsPageSkeleton />}><P.Interacoes /></Protected>} />
      <Route path="/inbox" element={<Protected><P.Inbox /></Protected>} />
      <Route path="/pipeline" element={<Protected><P.PipelinePage /></Protected>} />
      <Route path="/insights" element={<Protected fallback={<InsightsPageSkeleton />}><P.Insights /></Protected>} />
      <Route path="/analytics" element={<Protected fallback={<AnalyticsPageSkeleton />}><P.Analytics /></Protected>} />
      <Route path="/configuracoes" element={<Protected fallback={<SettingsPageSkeleton />}><P.Configuracoes /></Protected>} />
      <Route path="/calendario" element={<Protected fallback={<CalendarPageSkeleton />}><P.Calendario /></Protected>} />
      <Route path="/notificacoes" element={<Protected><P.Notificacoes /></Protected>} />
      <Route path="/notificacoes/configuracoes" element={<Protected><P.NotificacoesConfig /></Protected>} />
      <Route path="/network" element={<Protected fallback={<NetworkPageSkeleton />}><P.Network /></Protected>} />
      <Route path="/intelligence" element={<Protected><P.Intelligence /></Protected>} />
      <Route path="/relatorio/:id" element={<Protected><P.RelatorioContato /></Protected>} />

      {/* Protected — automação/marketing */}
      <Route path="/automacoes" element={<Protected><P.Automacoes /></Protected>} />
      <Route path="/sequencias" element={<Protected><P.Sequencias /></Protected>} />
      <Route path="/mapa-empresas" element={<Protected><P.MapaEmpresas /></Protected>} />
      <Route path="/metas" element={<Protected><P.Metas /></Protected>} />
      <Route path="/performance" element={<Protected><P.Performance /></Protected>} />
      <Route path="/territorios" element={<Protected><P.Territorios /></Protected>} />
      <Route path="/territory-optimization" element={<Protected><P.TerritoryOptimization /></Protected>} />
      <Route path="/abm" element={<Protected><P.ABM /></Protected>} />
      <Route path="/abm/campanhas" element={<Protected><P.ABMCampaigns /></Protected>} />
      <Route path="/abm/:id" element={<Protected><P.ABMAccountDetail /></Protected>} />
      <Route path="/intent" element={<Protected><P.IntentPage /></Protected>} />
      <Route path="/intent/setup" element={<Protected><P.IntentSetupPage /></Protected>} />
      <Route path="/lead-scoring" element={<Protected><P.LeadScoringPage /></Protected>} />
      <Route path="/lead-scoring/config" element={<Protected><P.LeadScoringConfigPage /></Protected>} />
      <Route path="/lead-scoring/automations" element={<Protected><P.LeadScoringAutomationsPage /></Protected>} />
      <Route path="/enrichment" element={<Protected><P.EnrichmentPage /></Protected>} />
      <Route path="/win-loss" element={<Protected><P.WinLossPage /></Protected>} />
      <Route path="/win-loss/setup" element={<Protected><P.WinLossSetupPage /></Protected>} />
      <Route path="/conversation-intelligence" element={<Protected><P.ConversationIntelligencePage /></Protected>} />
      <Route path="/conversation-intelligence/setup" element={<Protected><P.ConversationIntelligenceSetupPage /></Protected>} />
      <Route path="/forecasting" element={<Protected><P.ForecastingPage /></Protected>} />
      <Route path="/forecasting/setup" element={<Protected><P.ForecastingSetupPage /></Protected>} />
      <Route path="/revops" element={<Protected><P.RevOpsPage /></Protected>} />
      <Route path="/customer-success" element={<Protected><P.CustomerSuccessPage /></Protected>} />
      <Route path="/customer-success/account/:id" element={<Protected><P.CustomerSuccessAccountPage /></Protected>} />
      <Route path="/deal-rooms" element={<Protected><P.DealRoomsPage /></Protected>} />
      <Route path="/deal-rooms/:id" element={<Protected><P.DealRoomDetailPage /></Protected>} />
      <Route path="/playbooks" element={<Protected><P.PlaybooksPage /></Protected>} />
      <Route path="/playbooks/battle-cards/:id" element={<Protected><P.BattleCardDetailPage /></Protected>} />
      <Route path="/playbooks/:id" element={<Protected><P.PlaybookDetailPage /></Protected>} />
      <Route path="/rodizio" element={<Protected><P.Rodizio /></Protected>} />
      <Route path="/tarefas" element={<Protected><P.Tarefas /></Protected>} />
      <Route path="/bi" element={<Protected><P.BIAvancado /></Protected>} />
      <Route path="/suporte" element={<Protected><P.Suporte /></Protected>} />
      <Route path="/report-builder" element={<Protected><P.ReportBuilder /></Protected>} />
      <Route path="/relatorios-customizaveis" element={<Protected><P.CustomReports /></Protected>} />
      <Route path="/assistente" element={<Protected><P.Assistente /></Protected>} />
      <Route path="/nps" element={<Protected><P.NPS /></Protected>} />
      <Route path="/campanhas" element={<Protected><P.Campanhas /></Protected>} />
      <Route path="/sms-marketing" element={<Protected><P.SmsMarketing /></Protected>} />
      <Route path="/knowledge-base" element={<Protected><P.KnowledgeBase /></Protected>} />
      <Route path="/nurturing" element={<Protected><P.Nurturing /></Protected>} />
      <Route path="/landing-pages" element={<Protected><P.LandingPagesPage /></Protected>} />
      <Route path="/marketing" element={<Protected><P.MarketingHub /></Protected>} />
      <Route path="/marketing/forms/:id" element={<Protected><P.MarketingFormDetail /></Protected>} />
      <Route path="/marketing/lead-magnets/:id" element={<Protected><P.MarketingMagnetDetail /></Protected>} />
      <Route path="/deduplicacao" element={<Protected><P.Deduplicacao /></Protected>} />
      <Route path="/erp" element={<Protected><P.ErpViewer /></Protected>} />
      <Route path="/documentos" element={<Protected><P.Documentos /></Protected>} />
      <Route path="/whatsapp" element={<RequireAuth><Navigate to="/interacoes?canal=whatsapp" replace /></RequireAuth>} />
      <Route path="/seguranca" element={<Protected><P.SecurityPage /></Protected>} />

      {/* Admin routes */}
      <Route path="/admin" element={<Admin><P.AdminDashboard /></Admin>} />
      <Route path="/admin/roles" element={<Admin><P.RolesPage /></Admin>} />
      <Route path="/admin/permissions" element={<Admin><P.PermissionsPage /></Admin>} />
      <Route path="/admin/role-permissions" element={<Admin><P.RolePermissionsPage /></Admin>} />
      <Route path="/admin/seguranca" element={<Admin><P.AdminSegurancaPage /></Admin>} />
      <Route path="/admin/telemetria" element={<Admin><P.AdminTelemetria /></Admin>} />
      <Route path="/admin/schema-drift" element={<Admin><P.AdminSchemaDrift /></Admin>} />
      <Route path="/admin/field-mapping" element={<Admin><P.AdminFieldMapping /></Admin>} />
      <Route path="/admin/email-diagnostics" element={<Admin><P.AdminEmailDiagnostics /></Admin>} />
      <Route path="/admin/voice-diagnostics" element={<Admin><P.AdminVoiceDiagnostics /></Admin>} />
      <Route path="/admin/lux-config" element={<Admin><P.AdminLuxConfig /></Admin>} />
      <Route path="/admin/secrets-management" element={<Admin><P.AdminSecretsManagement /></Admin>} />
      <Route path="/admin/conexoes" element={<Admin><P.AdminConexoes /></Admin>} />
      <Route path="/admin/audit-trail" element={<Admin><P.AdminAuditTrail /></Admin>} />
      <Route path="/admin/knowledge-export" element={<Admin><P.AdminKnowledgeExport /></Admin>} />
      <Route path="/admin/error-logs" element={<Admin><P.AdminErrorLogs /></Admin>} />
      <Route path="/admin/component-gallery" element={<Admin><P.AdminComponentGallery /></Admin>} />
      <Route path="/admin/docs" element={<Admin><P.DocsPage /></Admin>} />
      <Route path="/admin/feature-flags" element={<Admin><P.AdminFeatureFlagsPage /></Admin>} />
      <Route path="/admin/error-budget" element={<Admin><P.AdminErrorBudget /></Admin>} />

      {/* Catch-all */}
      <Route path="*" element={<LazyPage><P.NotFound /></LazyPage>} />
    </Routes>
  );
};
