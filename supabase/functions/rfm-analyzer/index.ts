import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import {
  corsHeaders,
  withAuthOrServiceRole,
  isServiceRoleCaller,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";

const RfmInput = z.object({
  contactId: z.string().uuid("contactId deve ser UUID válido").optional(),
  userId: z.string().uuid("userId deve ser UUID válido").optional(),
});

interface ContactMetrics {
  contactId: string;
  daysSinceLastPurchase: number;
  daysSinceLastInteraction: number;
  totalPurchases: number;
  totalInteractions: number;
  totalValue: number;
  averageOrderValue: number;
}

const limiter = rateLimit({ windowMs: 60_000, max: 15 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let requestBody: z.infer<typeof RfmInput> = {};
    try {
      const raw = await req.json();
      const parsed = RfmInput.safeParse(raw);
      if (!parsed.success) return jsonError(`Entrada inválida: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400);
      requestBody = parsed.data;
    } catch {
      // no body — run for all contacts
    }
    const { contactId } = requestBody;

    let userId: string;
    if (isServiceRoleCaller(authResult)) {
      if (!requestBody.userId) return jsonError("userId required for service-role calls", 400);
      userId = requestBody.userId;
    } else {
      userId = authResult;
    }

    // Running RFM analysis

    let contactsQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name, company_id')
      .eq('user_id', userId);
    
    if (contactId && contactId !== 'all') {
      contactsQuery = contactsQuery.eq('id', contactId);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) throw contactsError;

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchase_history')
      .select('*')
      .eq('user_id', userId);
    if (purchasesError) throw purchasesError;

    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('id, contact_id, created_at')
      .eq('user_id', userId);
    if (interactionsError) throw interactionsError;

    const now = new Date();
    const contactMetrics: Map<string, ContactMetrics> = new Map();

    for (const contact of contacts || []) {
      const contactPurchases = (purchases || []).filter(p => p.contact_id === contact.id);
      const contactInteractions = (interactions || []).filter(i => i.contact_id === contact.id);

      const lastPurchase = contactPurchases.length > 0
        ? new Date(Math.max(...contactPurchases.map(p => new Date(p.purchase_date).getTime())))
        : null;

      const lastInteraction = contactInteractions.length > 0
        ? new Date(Math.max(...contactInteractions.map(i => new Date(i.created_at).getTime())))
        : null;

      const totalValue = contactPurchases.reduce((sum: number, p: Record<string, unknown>) => sum + (Number(p.amount) || 0), 0);

      contactMetrics.set(contact.id, {
        contactId: contact.id,
        daysSinceLastPurchase: lastPurchase 
          ? Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        daysSinceLastInteraction: lastInteraction
          ? Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        totalPurchases: contactPurchases.length,
        totalInteractions: contactInteractions.length,
        totalValue,
        averageOrderValue: contactPurchases.length > 0 ? totalValue / contactPurchases.length : 0
      });
    }

    const allMetrics = Array.from(contactMetrics.values());
    const recencyValues = allMetrics.map(m => m.daysSinceLastPurchase).sort((a, b) => a - b);
    const frequencyValues = allMetrics.map(m => m.totalPurchases).sort((a, b) => a - b);
    const monetaryValues = allMetrics.map(m => m.totalValue).sort((a, b) => a - b);

    const getPercentiles = (arr: number[]): number[] => {
      const len = arr.length;
      if (len === 0) return [0, 0, 0, 0];
      return [
        arr[Math.floor(len * 0.2)] || 0,
        arr[Math.floor(len * 0.4)] || 0,
        arr[Math.floor(len * 0.6)] || 0,
        arr[Math.floor(len * 0.8)] || 0
      ];
    };

    const recencyPercentiles = getPercentiles(recencyValues);
    const frequencyPercentiles = getPercentiles(frequencyValues);
    const monetaryPercentiles = getPercentiles(monetaryValues);

    const calculateScore = (value: number, percentiles: number[], isRecency = false): number => {
      if (isRecency) {
        if (value <= percentiles[0]) return 5;
        if (value <= percentiles[1]) return 4;
        if (value <= percentiles[2]) return 3;
        if (value <= percentiles[3]) return 2;
        return 1;
      }
      if (value >= percentiles[3]) return 5;
      if (value >= percentiles[2]) return 4;
      if (value >= percentiles[1]) return 3;
      if (value >= percentiles[0]) return 2;
      return 1;
    };

    const determineSegment = (r: number, f: number, m: number): string => {
      if (r >= 4 && f >= 4 && m >= 4) return 'champions';
      if (f >= 4 && m >= 4) return 'loyal_customers';
      if (r <= 2 && f >= 4 && m >= 4) return 'cant_lose';
      if (r <= 2 && f >= 3 && m >= 3) return 'at_risk';
      if (r >= 4 && f >= 2 && f <= 4) return 'potential_loyalists';
      if (r >= 4 && f <= 2) return 'recent_customers';
      if (r >= 3 && m <= 2) return 'promising';
      if (r === 3 && f === 3 && m === 3) return 'needing_attention';
      if (r === 2 && f <= 3 && m <= 3) return 'about_to_sleep';
      if (r <= 2 && f <= 2) return 'hibernating';
      if (r === 1 && f === 1 && m === 1) return 'lost';
      return 'needing_attention';
    };

    const segmentDescriptions: Record<string, string> = {
      champions: 'Compram frequentemente, gastam muito e compraram recentemente',
      loyal_customers: 'Compram regularmente e gastam bem',
      potential_loyalists: 'Clientes recentes com bom potencial',
      recent_customers: 'Compraram recentemente pela primeira vez',
      promising: 'Compradores recentes com potencial de crescimento',
      needing_attention: 'Clientes médios que estão esfriando',
      about_to_sleep: 'Abaixo da média, podem ser perdidos em breve',
      at_risk: 'Gastaram muito antes mas não compram há tempo',
      cant_lose: 'Grandes gastadores que estão escapando',
      hibernating: 'Última compra foi há muito tempo, baixo valor',
      lost: 'Menor recência, frequência e valor monetário'
    };

    const results = [];

    for (const [cId, metrics] of contactMetrics) {
      const recencyScore = calculateScore(metrics.daysSinceLastPurchase, recencyPercentiles, true);
      const frequencyScore = calculateScore(metrics.totalPurchases, frequencyPercentiles);
      const monetaryScore = calculateScore(metrics.totalValue, monetaryPercentiles);
      
      const segment = determineSegment(recencyScore, frequencyScore, monetaryScore);
      
      let churnProbability = (6 - recencyScore) * 15;
      churnProbability -= (frequencyScore - 1) * 5;
      if (metrics.daysSinceLastPurchase > 90) churnProbability += 20;
      else if (metrics.daysSinceLastPurchase > 60) churnProbability += 10;
      churnProbability = Math.max(0, Math.min(100, churnProbability));

      let communicationPriority = 'medium';
      if (['cant_lose', 'at_risk'].includes(segment) || churnProbability > 70) {
        communicationPriority = 'urgent';
      } else if (['about_to_sleep', 'needing_attention'].includes(segment) || churnProbability > 50) {
        communicationPriority = 'high';
      } else if (!['champions', 'loyal_customers', 'potential_loyalists'].includes(segment)) {
        communicationPriority = 'low';
      }

      const avgCycle = metrics.totalPurchases > 1 
        ? Math.round(metrics.daysSinceLastPurchase / metrics.totalPurchases)
        : 30;
      
      const predictedNextPurchase = metrics.daysSinceLastPurchase < 999
        ? new Date(now.getTime() + avgCycle * 24 * 60 * 60 * 1000)
        : null;

      const rfmResult = {
        user_id: userId,
        contact_id: cId,
        recency_score: recencyScore,
        frequency_score: frequencyScore,
        monetary_score: monetaryScore,
        days_since_last_purchase: metrics.daysSinceLastPurchase < 999 ? metrics.daysSinceLastPurchase : null,
        days_since_last_interaction: metrics.daysSinceLastInteraction < 999 ? metrics.daysSinceLastInteraction : null,
        total_purchases: metrics.totalPurchases,
        total_interactions: metrics.totalInteractions,
        total_monetary_value: metrics.totalValue,
        average_order_value: metrics.averageOrderValue,
        segment,
        segment_description: segmentDescriptions[segment],
        segment_color: getSegmentColor(segment),
        churn_probability: churnProbability,
        communication_priority: communicationPriority,
        predicted_next_purchase_date: predictedNextPurchase?.toISOString().split('T')[0],
        predicted_lifetime_value: metrics.averageOrderValue * 12 * (recencyScore + frequencyScore) / 2,
        recommended_actions: generateActions(segment),
        recommended_offers: generateOffers(segment),
        analyzed_at: now.toISOString()
      };

      const { error: upsertError } = await supabase
        .from('rfm_analysis')
        .upsert(rfmResult, { onConflict: 'user_id,contact_id' });

      if (upsertError) {
        console.error('Error upserting RFM:', upsertError);
      }

      await supabase.from('rfm_history').insert({
        user_id: userId,
        contact_id: cId,
        recency_score: recencyScore,
        frequency_score: frequencyScore,
        monetary_score: monetaryScore,
        segment,
        total_monetary_value: metrics.totalValue
      });

      results.push(rfmResult);
    }

    // RFM analysis completed

    return jsonOk({ 
      success: true, 
      analyzed: results.length,
      results 
    });

  } catch (error: unknown) {
    console.error('RFM analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(errorMessage, 500);
  }
});

function getSegmentColor(segment: string): string {
  const colors: Record<string, string> = {
    champions: 'text-emerald-600',
    loyal_customers: 'text-green-600',
    potential_loyalists: 'text-cyan-600',
    recent_customers: 'text-blue-600',
    promising: 'text-indigo-600',
    needing_attention: 'text-yellow-600',
    about_to_sleep: 'text-orange-600',
    at_risk: 'text-red-500',
    cant_lose: 'text-red-600',
    hibernating: 'text-gray-500',
    lost: 'text-gray-400'
  };
  return colors[segment] || 'text-gray-500';
}

function generateActions(segment: string): object[] {
  const actions: Record<string, object[]> = {
    champions: [
      { action: 'Oferecer programa VIP', description: 'Convidar para programa de fidelidade exclusivo', priority: 1, channel: 'email', timing: 'Esta semana' },
      { action: 'Pedir indicações', description: 'Solicitar recomendações para novos clientes', priority: 2, channel: 'whatsapp', timing: 'Após próxima compra' }
    ],
    loyal_customers: [
      { action: 'Upsell premium', description: 'Apresentar produtos de maior valor', priority: 1, channel: 'email', timing: 'Esta semana' }
    ],
    at_risk: [
      { action: 'Contato urgente', description: 'Ligar para entender situação', priority: 1, channel: 'phone', timing: 'Hoje' },
      { action: 'Oferta win-back', description: 'Desconto especial + brinde', priority: 2, channel: 'email', timing: 'Imediato' }
    ],
    cant_lose: [
      { action: 'Reunião presencial', description: 'Visita pessoal ou vídeo chamada', priority: 1, channel: 'meeting', timing: 'Esta semana' }
    ]
  };
  return actions[segment] || [{ action: 'Manter contato regular', description: 'Enviar comunicação periódica', priority: 1, channel: 'email', timing: 'Próxima semana' }];
}

function generateOffers(segment: string): object[] {
  const offers: Record<string, object[]> = {
    champions: [
      { offerType: 'Acesso VIP', description: 'Acesso antecipado a novos produtos', validDays: 30, reason: 'Recompensar lealdade' }
    ],
    at_risk: [
      { offerType: 'Win-Back', description: 'Desconto agressivo + brinde', discountPercent: 30, validDays: 3, reason: 'Recuperar cliente' }
    ],
    cant_lose: [
      { offerType: 'VIP Especial', description: 'Condições exclusivas personalizadas', discountPercent: 35, validDays: 7, reason: 'Salvar relacionamento' }
    ]
  };
  return offers[segment] || [];
}
