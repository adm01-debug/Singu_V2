// RFM Analysis Types - The most complete RFM system

export type RFMScore = 1 | 2 | 3 | 4 | 5;

export type RFMSegment =
  | 'champions'
  | 'loyal_customers'
  | 'potential_loyalists'
  | 'recent_customers'
  | 'promising'
  | 'needing_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose'
  | 'hibernating'
  | 'lost';

export type RFMTrend = 'improving' | 'stable' | 'declining';

export type CommunicationPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface RFMAnalysis {
  id: string;
  userId: string;
  contactId: string;
  
  // Scores
  recencyScore: RFMScore;
  frequencyScore: RFMScore;
  monetaryScore: RFMScore;
  rfmScore: number; // R*100 + F*10 + M (e.g., 555 = best)
  totalScore: number; // R + F + M (3-15)
  
  // Raw metrics
  daysSinceLastPurchase: number | null;
  daysSinceLastInteraction: number | null;
  totalPurchases: number;
  totalInteractions: number;
  totalMonetaryValue: number;
  averageOrderValue: number;
  
  // Segmentation
  segment: RFMSegment;
  segmentDescription: string;
  segmentColor: string;
  
  // Trends
  recencyTrend: RFMTrend | null;
  frequencyTrend: RFMTrend | null;
  monetaryTrend: RFMTrend | null;
  overallTrend: RFMTrend | null;
  
  // Predictions
  predictedNextPurchaseDate: Date | null;
  predictedLifetimeValue: number | null;
  churnProbability: number | null;
  
  // Recommendations
  recommendedActions: RFMAction[];
  recommendedOffers: RFMOffer[];
  communicationPriority: CommunicationPriority;
  
  // Metadata
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RFMAction {
  id: string;
  action: string;
  description: string;
  priority: number;
  channel: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'any';
  timing: string;
  expectedImpact: string;
}

export interface RFMOffer {
  id: string;
  offerType: string;
  description: string;
  discountPercent?: number;
  validDays: number;
  reason: string;
}

export interface RFMHistory {
  id: string;
  contactId: string;
  recencyScore: RFMScore;
  frequencyScore: RFMScore;
  monetaryScore: RFMScore;
  segment: RFMSegment;
  totalMonetaryValue: number | null;
  recordedAt: Date;
}

export interface RFMSegmentConfig {
  id: string;
  userId: string;
  segmentName: string;
  segmentKey: RFMSegment;
  description: string;
  color: string;
  icon: string;
  recencyMin: number;
  recencyMax: number;
  frequencyMin: number;
  frequencyMax: number;
  monetaryMin: number;
  monetaryMax: number;
  recommendedActions: RFMAction[];
  emailTemplate: string | null;
  priority: number;
}

export interface RFMMetrics {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  // Segment counts
  championsCount: number;
  loyalCount: number;
  potentialLoyalistCount: number;
  recentCustomersCount: number;
  promisingCount: number;
  needingAttentionCount: number;
  aboutToSleepCount: number;
  atRiskCount: number;
  cantLoseCount: number;
  hibernatingCount: number;
  lostCount: number;
  
  // General metrics
  totalContactsAnalyzed: number;
  averageRfmScore: number;
  averageMonetaryValue: number;
  totalRevenue: number;
  
  // Segment transitions
  segmentTransitions: Record<string, Record<string, number>>;
}

export interface RFMContactSummary {
  contactId: string;
  contactName: string;
  companyName: string | null;
  avatarUrl: string | null;
  rfmAnalysis: RFMAnalysis | null;
  history: RFMHistory[];
}

export interface RFMDashboardStats {
  totalAnalyzed: number;
  averageRfmScore: number;
  averageMonetaryValue: number;
  totalRevenue: number;
  segmentDistribution: Record<RFMSegment, number>;
  scoreDistribution: {
    recency: Record<number, number>;
    frequency: Record<number, number>;
    monetary: Record<number, number>;
  };
  trends: {
    improving: number;
    stable: number;
    declining: number;
  };
  priorityDistribution: Record<CommunicationPriority, number>;
  atRiskRevenue: number;
  championsRevenue: number;
}

// Segment configuration with labels and colors
export const RFM_SEGMENTS: Record<RFMSegment, {
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
  actionFocus: string;
}> = {
  champions: {
    name: 'Campeões',
    description: 'Compram frequentemente, gastam muito e compraram recentemente',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: 'trophy',
    priority: 1,
    actionFocus: 'Recompensar lealdade, oferecer exclusividade'
  },
  loyal_customers: {
    name: 'Clientes Fiéis',
    description: 'Compram regularmente e gastam bem',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: 'heart',
    priority: 2,
    actionFocus: 'Upsell, programas de fidelidade'
  },
  potential_loyalists: {
    name: 'Potenciais Fiéis',
    description: 'Clientes recentes com bom potencial',
    color: 'text-info',
    bgColor: 'bg-info/10',
    icon: 'star',
    priority: 3,
    actionFocus: 'Criar relacionamento, ofertas personalizadas'
  },
  recent_customers: {
    name: 'Clientes Recentes',
    description: 'Compraram recentemente pela primeira vez',
    color: 'text-info',
    bgColor: 'bg-info/10',
    icon: 'sparkles',
    priority: 4,
    actionFocus: 'Onboarding, primeira experiência excepcional'
  },
  promising: {
    name: 'Promissores',
    description: 'Compradores recentes com potencial de crescimento',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: 'trending-up',
    priority: 5,
    actionFocus: 'Engajamento, educação sobre produtos'
  },
  needing_attention: {
    name: 'Precisam de Atenção',
    description: 'Clientes médios que estão esfriando',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: 'bell',
    priority: 6,
    actionFocus: 'Reengajamento, ofertas limitadas'
  },
  about_to_sleep: {
    name: 'Prestes a Dormir',
    description: 'Abaixo da média, podem ser perdidos em breve',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: 'moon',
    priority: 7,
    actionFocus: 'Reativação urgente, descobrir problemas'
  },
  at_risk: {
    name: 'Em Risco',
    description: 'Gastaram muito antes mas não compram há tempo',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: 'alert-triangle',
    priority: 8,
    actionFocus: 'Win-back agressivo, ofertas especiais'
  },
  cant_lose: {
    name: 'Não Podemos Perder',
    description: 'Grandes gastadores que estão escapando',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    icon: 'shield-alert',
    priority: 9,
    actionFocus: 'Contato pessoal imediato, resolver problemas'
  },
  hibernating: {
    name: 'Hibernando',
    description: 'Última compra foi há muito tempo, baixo valor',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: 'pause-circle',
    priority: 10,
    actionFocus: 'Campanhas de reativação de baixo custo'
  },
  lost: {
    name: 'Perdidos',
    description: 'Menor recência, frequência e valor monetário',
    color: 'text-muted-foreground/70',
    bgColor: 'bg-muted/50',
    icon: 'x-circle',
    priority: 11,
    actionFocus: 'Última tentativa ou arquivar'
  }
};

// Score labels
export const RFM_SCORE_LABELS: Record<RFMScore, string> = {
  1: 'Muito Baixo',
  2: 'Baixo',
  3: 'Médio',
  4: 'Alto',
  5: 'Muito Alto'
};

// Utility function to determine segment from scores
export function determineRFMSegment(r: RFMScore, f: RFMScore, m: RFMScore): RFMSegment {
  // Champions: High in all three
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  
  // Loyal Customers: High frequency and monetary
  if (f >= 4 && m >= 4) return 'loyal_customers';
  
  // Can't Lose: Were great customers (high M/F) but low recency
  if (r <= 2 && f >= 4 && m >= 4) return 'cant_lose';
  
  // At Risk: Were good customers but haven't bought recently
  if (r <= 2 && f >= 3 && m >= 3) return 'at_risk';
  
  // Potential Loyalists: Recent customers with growing frequency
  if (r >= 4 && f >= 2 && f <= 4) return 'potential_loyalists';
  
  // Recent Customers: Very recent, low frequency
  if (r >= 4 && f <= 2) return 'recent_customers';
  
  // Promising: Recent but low monetary
  if (r >= 3 && m <= 2) return 'promising';
  
  // Needing Attention: Average in everything
  if (r === 3 && f === 3 && m === 3) return 'needing_attention';

  // Lost: Lowest scores (mais específico primeiro para não ser eclipsado por hibernating)
  if (r === 1 && f === 1 && m === 1) return 'lost';

  // Hibernating: Low recency and frequency
  if (r <= 2 && f <= 2) return 'hibernating';

  // About to Sleep: Below average, declining
  if (r === 2 && f <= 3 && m <= 3) return 'about_to_sleep';

  // Default to needing attention
  return 'needing_attention';
}

// Calculate score from percentile
export function calculateRFMScore(value: number, percentiles: number[], isRecency: boolean = false): RFMScore {
  // For recency, lower is better (more recent)
  if (isRecency) {
    if (value <= percentiles[0]) return 5;
    if (value <= percentiles[1]) return 4;
    if (value <= percentiles[2]) return 3;
    if (value <= percentiles[3]) return 2;
    return 1;
  }
  
  // For frequency and monetary, higher is better
  if (value >= percentiles[3]) return 5;
  if (value >= percentiles[2]) return 4;
  if (value >= percentiles[1]) return 3;
  if (value >= percentiles[0]) return 2;
  return 1;
}
