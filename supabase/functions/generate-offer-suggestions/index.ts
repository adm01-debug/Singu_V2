import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
  guardBody,
} from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";
import {
  buildCatalog,
  buildFallbackOrder,
  buildKeywordIndex,
  candidatesFor,
  keywordsFrom,
  normalizeText,
  type CatalogItem,
  type ProductRow,
} from "./catalog.ts";

interface OfferSuggestion {
  contactId: string;
  offerName: string;
  offerCategory: string;
  reason: string;
  confidenceScore: number;
  metadata?: {
    sources?: string[];
    keywords?: string[];
    social_insight_ids?: string[];
  };
}

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

const LEGACY_OFFER_CATALOG: CatalogItem[] = [
  { name: 'Upgrade para Plano Premium', category: 'Upgrade', targetScore: 70, keywords: ['crescimento', 'expansão', 'mais recursos'] },
  { name: 'Treinamento Avançado', category: 'Serviço', targetScore: 60, keywords: ['dificuldade', 'aprender', 'capacitar'] },
  { name: 'Consultoria Personalizada', category: 'Consultoria', targetScore: 80, keywords: ['estratégia', 'otimização', 'resultados'] },
  { name: 'Plano Anual com Desconto', category: 'Renovação', targetScore: 50, keywords: ['custo', 'economia', 'orçamento'] },
  { name: 'Módulo de Integração', category: 'Addon', targetScore: 65, keywords: ['integrar', 'automatizar', 'conectar'] },
  { name: 'Suporte Premium 24/7', category: 'Suporte', targetScore: 55, keywords: ['urgência', 'problema', 'ajuda'] },
  { name: 'Licenças Adicionais', category: 'Expansão', targetScore: 60, keywords: ['equipe', 'colaboradores', 'usuários'] },
  { name: 'Migração de Dados', category: 'Serviço', targetScore: 45, keywords: ['migrar', 'transferir', 'importar'] },
];

// O catalogo real tem milhares de produtos: reler tudo a cada clique em
// "sugestoes de oferta" inviabiliza a geracao. O isolate do Deno sobrevive
// entre invocacoes, entao o catalogo fica em cache curto.
const CATALOG_TTL_MS = 5 * 60 * 1000;
const CATALOG_PAGE_SIZE = 1000;
const CATALOG_MAX_ROWS = 12_000;
let catalogCache: { loadedAt: number; rows: ProductRow[] } | null = null;

async function loadCatalogRows(supabase: SupabaseClient): Promise<ProductRow[]> {
  if (catalogCache && Date.now() - catalogCache.loadedAt < CATALOG_TTL_MS) {
    return catalogCache.rows;
  }

  const rows: ProductRow[] = [];
  try {
    for (let offset = 0; offset < CATALOG_MAX_ROWS; offset += CATALOG_PAGE_SIZE) {
      const { data, error } = await supabase
        .from('products')
        .select('name, category, unit_price, stock_qty, metadata')
        .eq('is_active', true)
        .gt('unit_price', 0)
        .order('sku', { ascending: true })
        .range(offset, offset + CATALOG_PAGE_SIZE - 1);
      if (error) throw error;
      const page = (data ?? []) as ProductRow[];
      rows.push(...page);
      if (page.length < CATALOG_PAGE_SIZE) break;
    }
  } catch (error) {
    console.error('Falha ao carregar o catalogo de produtos:', error);
    return catalogCache?.rows ?? [];
  }

  catalogCache = { loadedAt: Date.now(), rows };
  return rows;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;


  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const { body: rawBody, error: bodyError } = await guardBody(req, 256 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const vgo = validate(rawBody ?? {}, {
      contactId: { type: 'string', maxLength: 36 },
    });
    if (!vgo.ok) return jsonError(vgo.error, 400, req);
    const { contactId } = vgo.data as { contactId?: string };

    // Generating offer suggestions — scoped to authenticated user

    // Build query for contacts — always scoped to authenticated user
    let contactsQuery = supabase.from('contacts').select('*').eq('user_id', userId);
    if (contactId) contactsQuery = contactsQuery.eq('id', contactId);
    
    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return jsonOk({ success: true, suggestions: [] }, req);
    }

    // Fetch all dependent data in parallel — all 6 queries depend only on contactIds
    const contactIds = contacts.map(c => c.id);
    const [
      { data: purchases },
      { data: interactions },
      { data: analyticalProfiles },
      { data: socialAnalysis },
      { data: existingOffers },
      { data: allSocialInsights },
      catalogProducts,
    ] = await Promise.all([
      supabase.from('purchase_history').select('*').in('contact_id', contactIds).order('purchase_date', { ascending: false }),
      supabase.from('interactions').select('*').in('contact_id', contactIds).order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_analytical_profiles').select('*').in('contact_id', contactIds),
      supabase.from('social_behavior_analysis').select('*').in('contact_id', contactIds),
      supabase.from('offer_suggestions').select('contact_id, offer_name').in('contact_id', contactIds).eq('status', 'pending'),
      supabase.from('social_insights').select('id, contact_id, platform, content').in('contact_id', contactIds),
      loadCatalogRows(supabase),
    ]);

    const socialInsightsByContact = new Map<string, Array<{ id: string; platform: string; content: string }>>();
    for (const si of allSocialInsights ?? []) {
      const arr = socialInsightsByContact.get(si.contact_id) ?? [];
      arr.push({ id: si.id, platform: si.platform, content: si.content });
      socialInsightsByContact.set(si.contact_id, arr);
    }

    const existingOffersSet = new Set(
      (existingOffers || []).map(o => `${o.contact_id}-${o.offer_name}`)
    );

    // Catalogo real de ofertas: produtos que a empresa vende (espelho do ERP).
    // Sem produto cadastrado o motor cai no catalogo legado para nao ficar mudo.
    const catalogRows = (catalogProducts ?? []) as ProductRow[];
    const realCatalog = buildCatalog(catalogRows);
    const useRealCatalog = realCatalog.length > 0;
    const keywordIndex = useRealCatalog ? buildKeywordIndex(realCatalog) : new Map<string, number[]>();
    const fallbackOrder = useRealCatalog ? buildFallbackOrder(catalogRows) : [];
    const catalogForContext = (context: string): CatalogItem[] =>
      useRealCatalog
        ? candidatesFor(context, realCatalog, keywordIndex, fallbackOrder)
        : LEGACY_OFFER_CATALOG;


    const suggestions: OfferSuggestion[] = [];

    for (const contact of contacts) {
      const contactPurchases = (purchases || []).filter(p => p.contact_id === contact.id);
      const contactInteractions = (interactions || []).filter(i => i.contact_id === contact.id);
     const contactAnalytical = (analyticalProfiles || []).find(ap => ap.contact_id === contact.id);
     const contactSocial = (socialAnalysis || []).find(sa => sa.contact_id === contact.id);
      
      const interactionText = contactInteractions
        .map(i => `${i.content || ''} ${i.transcription || ''}`)
        .join(' ')
        .toLowerCase();
 
     const socialInterests = (contactSocial?.interests || []).join(' ').toLowerCase();
     const socialKeywords = (contactSocial?.keywords || []).join(' ').toLowerCase();
     const analyticalTopics = (contactAnalytical?.recurrent_topics || []).join(' ').toLowerCase();
     
     const combinedContext = `${interactionText} ${socialInterests} ${socialKeywords} ${analyticalTopics}`;

      const now = new Date();
      const upcomingRenewals = contactPurchases.filter(p => {
        if (!p.renewal_date) return false;
        const renewalDate = new Date(p.renewal_date);
        const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 60;
      });

      // Renovacao real vinda de purchase_history entra como oferta antes do catalogo.
      const renewalOffers: CatalogItem[] = upcomingRenewals.slice(0, 1).map((renewal) => ({
        name: `Renovação: ${renewal.product_name || 'Produto'}`,
        category: 'Renovação',
        targetScore: 50,
        keywords: keywordsFrom(renewal.product_name),
      }));
      const offerCatalog = [...renewalOffers, ...catalogForContext(normalizeText(combinedContext))];

      for (const offer of offerCatalog) {
        const key = `${contact.id}-${offer.name}`;
        if (existingOffersSet.has(key)) continue;

        let confidence = 30;
        const reasons: string[] = [];
        const matchedInsightIds: string[] = [];
        const matchedSources: string[] = [];
        const matchedKeywordsList: string[] = [];

        const score = contact.relationship_score || 50;
        if (score >= offer.targetScore) {
          confidence += 15;
          reasons.push(`Bom score de relacionamento (${score})`);
        }

        const matchedKeywords = offer.keywords.filter(kw => combinedContext.includes(kw.toLowerCase()));
        if (matchedKeywords.length > 0) {
          confidence += matchedKeywords.length * 10;
          
          // Identify which social insights caused the match (Map lookup — no DB call)
          const insights = socialInsightsByContact.get(contact.id);

          if (insights) {
            for (const insight of insights) {
              const matches = offer.keywords.filter(kw => insight.content.toLowerCase().includes(kw.toLowerCase()));
              if (matches.length > 0) {
                matchedInsightIds.push(insight.id);
                if (!matchedSources.includes(insight.platform)) matchedSources.push(insight.platform);
                matches.forEach(m => {
                  if (!matchedKeywordsList.includes(m)) matchedKeywordsList.push(m);
                });
              }
            }
          }

          if (matchedInsightIds.length > 0) {
            reasons.push(`Alinhamento com interesses sociais: ${matchedKeywords.join(', ')}`);
            confidence += 5; 
          } else {
            reasons.push(`Interesse detectado: ${matchedKeywords.join(', ')}`);
          }
        }

        if (contactPurchases.length > 0) {
          const hasCategory = contactPurchases.some(p => 
            p.product_category?.toLowerCase() === offer.category.toLowerCase()
          );
          if (hasCategory) {
            confidence += 10;
            reasons.push(`Histórico de compras similares`);
          }
          const totalSpent = contactPurchases.reduce((sum: number, p: Record<string, unknown>) => sum + (Number(p.amount) || 0), 0);
          if (totalSpent > 10000) {
            confidence += 10;
            reasons.push(`Cliente de alto valor`);
          }
        }

        if (offer.category === 'Renovação' && upcomingRenewals.length > 0) {
          confidence += 25;
          reasons.push(`Renovação próxima em ${upcomingRenewals.length} produto(s)`);
        }

        if (contact.role === 'decision_maker' || contact.role === 'owner') {
          confidence += 10;
          reasons.push(`Decisor/proprietário`);
        }

        if (contact.sentiment === 'positive') {
          confidence += 10;
          reasons.push(`Sentimento positivo`);
        } else if (contact.sentiment === 'negative') {
          confidence -= 20;
        }

        if (confidence >= 50 && reasons.length >= 2) {
          suggestions.push({
            contactId: contact.id,
            offerName: offer.name,
            offerCategory: offer.category,
            reason: reasons.slice(0, 3).join('. ') + '.',
            confidenceScore: Math.min(100, confidence),
            metadata: matchedInsightIds.length > 0 ? {
              sources: matchedSources,
              keywords: matchedKeywordsList,
              social_insight_ids: matchedInsightIds
            } : undefined
          });
        }
      }
    }

    suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);
    const topSuggestions = suggestions.slice(0, 50);

    if (topSuggestions.length > 0) {
      const insertData = topSuggestions.map(s => ({
        user_id: userId,
        contact_id: s.contactId,
        offer_name: s.offerName,
        offer_category: s.offerCategory,
        reason: s.reason,
        confidence_score: s.confidenceScore,
        status: 'pending',
        metadata: s.metadata,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('offer_suggestions')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting suggestions:', insertError);
      }
    }

    // Offer suggestions generated

    return jsonOk({ 
      success: true, 
      suggestionsGenerated: topSuggestions.length,
      suggestions: topSuggestions 
    }, req);

  } catch (error: unknown) {
    console.error("Error generating offer suggestions:", error);
    return jsonError("Internal server error", 500, req);
  }
});
