// Registro dos widgets do Report Builder. Este arquivo nao define componente
// nenhum: so mapeia id -> componente, para nao misturar export de componente
// com export de constante (react-refresh/only-export-components).
import {
  KpisWidget,
  ContactsCountWidget,
  CompaniesCountWidget,
  InteractionsWeekWidget,
  PipelineValueWidget,
  DealsByStageWidget,
  ChurnRiskWidget,
  BestTimeWidget,
  SentimentDistWidget,
  RecentActivityWidget,
  TopContactsWidget,
  TicketsOpenWidget,
} from './ReportWidgets';

export const WIDGET_COMPONENTS = {
  'kpis': KpisWidget,
  'contacts-count': ContactsCountWidget,
  'companies-count': CompaniesCountWidget,
  'interactions-week': InteractionsWeekWidget,
  'pipeline-value': PipelineValueWidget,
  'deals-by-stage': DealsByStageWidget,
  'churn-risk': ChurnRiskWidget,
  'best-time': BestTimeWidget,
  'sentiment-dist': SentimentDistWidget,
  'recent-activity': RecentActivityWidget,
  'top-contacts': TopContactsWidget,
  'tickets-open': TicketsOpenWidget,
} as const;

export type WidgetComponentId = keyof typeof WIDGET_COMPONENTS;
