export type SalesRole = 'sdr' | 'closer' | 'manager';

export type AssignmentType =
  | 'auto_round_robin'
  | 'auto_weighted'
  | 'auto_territory'
  | 'manual'
  | 'handoff'
  | 'redistribution';

export type AssignmentStatus = 'active' | 'completed' | 'expired' | 'reassigned';

export type HandoffStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export type RoutingRuleType =
  | 'round_robin'
  | 'weighted'
  | 'territory'
  | 'specialization'
  | 'load_balanced';

export type RedistributionReason =
  | 'inactivity'
  | 'capacity'
  | 'territory_change'
  | 'manual'
  | 'vacation'
  | 'performance';

export interface SalesTeamMember {
  id: string;
  user_id: string;
  profile_user_id?: string | null;
  name: string;
  email?: string | null;
  role: SalesRole;
  is_active: boolean;
  weight: number;
  max_leads_day: number;
  max_leads_total: number;
  current_lead_count: number;
  leads_today: number;
  leads_today_reset_at?: string | null;
  last_assigned_at?: string | null;
  territories: string[];
  specializations: string[];
  vacation_start?: string | null;
  vacation_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadRoutingRule {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  rule_type: RoutingRuleType;
  priority: number;
  conditions: Record<string, unknown>;
  team_pool: string[];
  role_filter: 'sdr' | 'closer' | 'any';
  is_active: boolean;
  fallback_rule_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadAssignment {
  id: string;
  user_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  assigned_to: string;
  assigned_by?: string | null;
  assignment_type: AssignmentType;
  previous_owner?: string | null;
  status: AssignmentStatus;
  routing_rule_id?: string | null;
  sla_deadline?: string | null;
  first_contact_at?: string | null;
  sla_met?: boolean | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from sales_team_members */
  assigned_member?: SalesTeamMember;
}

export interface HandoffRequest {
  id: string;
  user_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  from_member_id: string;
  to_member_id?: string | null;
  status: HandoffStatus;
  qualification_data: QualificationData;
  handoff_reason?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  sla_hours: number;
  accepted_at?: string | null;
  rejected_at?: string | null;
  expired_at?: string | null;
  created_at: string;
  updated_at: string;
  /** Joined */
  from_member?: SalesTeamMember;
  to_member?: SalesTeamMember;
}

export interface QualificationData {
  budget?: string;
  authority?: string;
  need?: string;
  timeline?: string;
  relationship_score?: number;
  disc_profile?: string;
  notes?: string;
}

export interface RedistributionEntry {
  id: string;
  user_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  from_member_id?: string | null;
  to_member_id?: string | null;
  reason: RedistributionReason;
  auto_triggered: boolean;
  inactivity_days?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface RoutingMetrics {
  totalAssignments: number;
  activeAssignments: number;
  slaCompliance: number;
  avgFirstContactHours: number;
  redistributions: number;
  pendingHandoffs: number;
  byRole: { sdr: number; closer: number };
  byType: Record<AssignmentType, number>;
}

export const ROLE_LABELS: Record<SalesRole, string> = {
  sdr: 'SDR',
  closer: 'Closer',
  manager: 'Gerente',
};

export const ROLE_COLORS: Record<SalesRole, string> = {
  sdr: 'text-info',
  closer: 'text-success',
  manager: 'text-warning',
};

export const STATUS_LABELS: Record<HandoffStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

export const RULE_TYPE_LABELS: Record<RoutingRuleType, string> = {
  round_robin: 'Round-Robin',
  weighted: 'Ponderado',
  territory: 'Território',
  specialization: 'Especialização',
  load_balanced: 'Balanceado por Carga',
};

export const REASON_LABELS: Record<RedistributionReason, string> = {
  inactivity: 'Inatividade',
  capacity: 'Capacidade',
  territory_change: 'Mudança de Território',
  manual: 'Manual',
  vacation: 'Férias',
  performance: 'Performance',
};
