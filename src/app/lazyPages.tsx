import { lazy } from 'react';

/**
 * Lazy-loaded pages — code splitting per route.
 * Extraído de App.tsx na Rodada O (Ação 8) para manter App.tsx <400 linhas.
 */

export const Analytics = lazy(() => import("@/pages/Analytics"));
export const Empresas = lazy(() => import("@/pages/Empresas"));
export const EmpresaDetalhe = lazy(() => import("@/pages/EmpresaDetalhe"));
export const Contatos = lazy(() => import("@/pages/Contatos"));
export const ContatoDetalhe = lazy(() => import("@/pages/ContatoDetalhe"));
export const Ficha360 = lazy(() => import("@/pages/Ficha360"));
export const Interacoes = lazy(() => import("@/pages/Interacoes"));
export const PipelinePage = lazy(() => import("@/pages/Pipeline"));
export const Insights = lazy(() => import("@/pages/Insights"));
export const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
export const Calendario = lazy(() => import("@/pages/Calendario"));
export const Notificacoes = lazy(() => import("@/pages/Notificacoes"));
export const NotificacoesConfig = lazy(() => import("@/pages/NotificacoesConfig"));
export const Network = lazy(() => import("@/pages/Network"));
export const NLPAnalytics = lazy(() => import("@/pages/NLPAnalytics"));
export const Auth = lazy(() => import("@/pages/Auth"));
export const Onboarding = lazy(() => import("@/pages/Onboarding"));
export const NotFound = lazy(() => import("@/pages/NotFound"));

export const RelatorioContato = lazy(() => import("@/pages/RelatorioContato"));
export const Automacoes = lazy(() => import("@/pages/Automacoes"));
export const Sequencias = lazy(() => import("@/pages/Sequencias"));
export const DesignSystem = lazy(() => import("@/pages/DesignSystem"));
export const MapaEmpresas = lazy(() => import("@/pages/MapaEmpresas"));
export const Metas = lazy(() => import("@/pages/Metas"));
export const Tarefas = lazy(() => import("@/pages/Tarefas"));
export const Inbox = lazy(() => import("@/pages/Inbox"));
export const Territorios = lazy(() => import("@/pages/Territorios"));
export const TerritoryOptimization = lazy(() => import("@/pages/TerritoryOptimization"));
export const ABM = lazy(() => import("@/pages/ABM"));
export const ABMAccountDetail = lazy(() => import("@/pages/ABMAccountDetail"));
export const ABMCampaigns = lazy(() => import("@/pages/ABMCampaigns"));
export const Rodizio = lazy(() => import("@/pages/Rodizio"));
export const Performance = lazy(() => import("@/pages/Performance"));
export const BIAvancado = lazy(() => import("@/pages/BIAvancado"));
export const Suporte = lazy(() => import("@/pages/Suporte"));
export const ReportBuilder = lazy(() => import("@/pages/ReportBuilder"));
export const CustomReports = lazy(() => import("@/pages/CustomReports"));
export const Assistente = lazy(() => import("@/pages/Assistente"));
export const NPS = lazy(() => import("@/pages/NPS"));
export const PublicSurvey = lazy(() => import("@/pages/PublicSurvey"));
export const Campanhas = lazy(() => import("@/pages/Campanhas"));
export const SmsMarketing = lazy(() => import("@/pages/SmsMarketing"));
export const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
export const Nurturing = lazy(() => import("@/pages/Nurturing"));
export const LandingPagesPage = lazy(() => import("@/pages/LandingPages"));
export const PublicLandingPage = lazy(() => import("@/pages/PublicLandingPage"));
export const MarketingHub = lazy(() => import("@/pages/MarketingHub"));
export const MarketingFormDetail = lazy(() => import("@/pages/MarketingFormDetail"));
export const MarketingMagnetDetail = lazy(() => import("@/pages/MarketingMagnetDetail"));
export const PublicForm = lazy(() => import("@/pages/PublicForm"));
export const PublicLeadMagnet = lazy(() => import("@/pages/PublicLeadMagnet"));

export const AdminTelemetria = lazy(() => import("@/pages/AdminTelemetria"));
export const AdminSchemaDrift = lazy(() => import("@/pages/AdminSchemaDrift"));
export const AdminFieldMapping = lazy(() => import("@/pages/AdminFieldMapping"));
export const AdminEmailDiagnostics = lazy(() => import("@/pages/AdminEmailDiagnostics"));
export const AdminVoiceDiagnostics = lazy(() => import("@/pages/AdminVoiceDiagnostics"));
export const AdminLuxConfig = lazy(() => import("@/pages/AdminLuxConfig"));
export const AdminConexoes = lazy(() => import("@/pages/AdminConexoes"));
export const AdminSecretsManagement = lazy(() => import("@/pages/AdminSecretsManagement"));
export const AdminKnowledgeExport = lazy(() => import("@/pages/AdminKnowledgeExport"));
export const AdminAuditTrail = lazy(() => import("@/pages/AdminAuditTrail"));
export const AdminErrorLogs = lazy(() => import("@/pages/admin/ErrorLogs"));
export const AdminComponentGallery = lazy(() => import("@/pages/admin/ComponentGallery"));
export const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
export const AdminSegurancaPage = lazy(() => import("@/pages/admin/AdminSegurancaPage"));
export const AdminFeatureFlagsPage = lazy(() => import("@/pages/admin/FeatureFlagsPage"));
export const AdminErrorBudget = lazy(() => import("@/pages/admin/ErrorBudget"));

export const Deduplicacao = lazy(() => import("@/pages/Deduplicacao"));
export const ErpViewer = lazy(() => import("@/pages/ErpViewer"));
export const Documentos = lazy(() => import("@/pages/Documentos"));
export const PublicSignaturePage = lazy(() => import("@/pages/PublicSignaturePage"));
export const SecurityPage = lazy(() => import("@/pages/Security"));
export const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
export const SSOCallbackPage = lazy(() => import("@/pages/SSOCallbackPage"));
export const RolesPage = lazy(() => import("@/pages/RolesPage"));
export const PermissionsPage = lazy(() => import("@/pages/PermissionsPage"));
export const RolePermissionsPage = lazy(() => import("@/pages/RolePermissionsPage"));
export const StatusPage = lazy(() => import("@/pages/StatusPage"));
export const DocsPage = lazy(() => import("@/pages/DocsPage"));

export const RequireAdminLazy = lazy(() =>
  import("@/components/admin/RequireAdmin").then(m => ({ default: m.RequireAdmin }))
);
export const SchemaDriftBannerLazy = lazy(() =>
  import("@/components/admin/SchemaDriftBanner").then(m => ({ default: m.SchemaDriftBanner }))
);

export const IntentPage = lazy(() => import("@/pages/Intent"));
export const IntentSetupPage = lazy(() => import("@/pages/IntentSetup"));
export const LeadScoringPage = lazy(() => import("@/pages/LeadScoring"));
export const LeadScoringConfigPage = lazy(() => import("@/pages/LeadScoringConfig"));
export const LeadScoringAutomationsPage = lazy(() => import("@/pages/LeadScoringAutomations"));
export const EnrichmentPage = lazy(() => import("@/pages/Enrichment"));
export const WinLossPage = lazy(() => import("@/pages/WinLoss"));
export const WinLossSetupPage = lazy(() => import("@/pages/WinLossSetup"));
export const ConversationIntelligencePage = lazy(() => import("@/pages/ConversationIntelligence"));
export const ConversationIntelligenceSetupPage = lazy(() => import("@/pages/ConversationIntelligenceSetup"));
export const ForecastingPage = lazy(() => import("@/pages/Forecasting"));
export const ForecastingSetupPage = lazy(() => import("@/pages/ForecastingSetup"));
export const RevOpsPage = lazy(() => import("@/pages/RevOps"));
export const DealRoomsPage = lazy(() => import("@/pages/DealRooms"));
export const DealRoomDetailPage = lazy(() => import("@/pages/DealRoomDetail"));
export const PublicDealRoomPage = lazy(() => import("@/pages/PublicDealRoom"));
export const PlaybooksPage = lazy(() => import("@/pages/Playbooks"));
export const PlaybookDetailPage = lazy(() => import("@/pages/PlaybookDetail"));
export const BattleCardDetailPage = lazy(() => import("@/pages/BattleCardDetail"));
export const CustomerSuccessPage = lazy(() => import("@/pages/CustomerSuccess"));
export const CustomerSuccessAccountPage = lazy(() => import("@/pages/CustomerSuccessAccount"));
export const Intelligence = lazy(() => import("@/pages/Intelligence"));
export const RecommendationAudit = lazy(() => import("@/pages/RecommendationAudit"));
 export const CRMRelationshipAudit = lazy(() => import("@/pages/CRMRelationshipAuditPage"));
 export const CopywritingEnterprise = lazy(() => import("@/pages/crm/CopywritingEnterprise"));

// Non-critical shell components
export const PWAShell = lazy(() =>
  import("@/components/pwa/PWAComponents").then(({ OfflineIndicator, InstallPrompt, NetworkStatusBadge }) => ({
    default: function PWAShellInner() {
      return (
        <>
          <OfflineIndicator />
          <InstallPrompt />
          <NetworkStatusBadge />
        </>
      );
    },
  }))
);

export const KeyboardShortcutsDialogEnhanced = lazy(() =>
  import("@/components/keyboard/KeyboardShortcutsDialogEnhanced").then(m => ({ default: m.KeyboardShortcutsDialogEnhanced }))
);

export const SessionExpiryHandler = lazy(() =>
  import("@/components/session/SessionExpiryHandler").then(m => ({ default: m.SessionExpiryHandler }))
);

export const WhatsNewModal = lazy(() =>
  import("@/components/features/WhatsNewModal").then(m => ({ default: m.WhatsNewModal }))
);

export const EasterEggsProvider = lazy(() =>
  import("@/hooks/useEasterEggs")
    .then(m => ({
      default: () => { m.useEasterEggs(); return null; },
    }))
    .catch(() => ({
      default: () => null,
    }))
);
