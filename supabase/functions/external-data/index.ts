import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, jsonError, jsonOk, handleCorsAndMethod } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { assertVersionMatch } from "../_shared/version-guard.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 100, message: "Rate limit exceeded for external data. Please wait." });

const ALLOWED_RPCS = [
  // ── Dashboard & KPIs ──
  'get_complete_dashboard', 'get_executive_dashboard', 'get_instant_kpis',
  'get_mini_dashboard', 'get_seller_dashboard', 'get_business_alerts',
  'get_daily_summary', 'get_weekly_summary',
  // ── Contact CRUD ──
  'create_contact', 'update_contact', 'soft_delete_contact',
  'merge_contacts', 'merge_duplicate_contacts',
  // ── Contact Search ──
  'search_contacts', 'search_contacts_advanced', 'search_contacts_fuzzy',
  'list_contacts_paginated', 'find_contacts_by_role',
  'get_contacts_by_role',
  // ── Contact Intelligence ──
  'get_contact_360_by_phone', 'get_contact_intelligence',
  'get_contact_intelligence_by_phone', 'get_contact_disc_profile',
  'get_contact_effectiveness', 'get_contact_engagement_score',
  'get_contact_statistics', 'get_contact_timeline',
  // ── Timing ──
  'get_best_contact_time', 'get_best_contact_times',
  'get_days_without_contact', 'get_last_contact_date',
  // ── Quality ──
  'get_duplicate_contacts', 'get_orphan_contacts',
  // ── Contact Upserts ──
  'upsert_contact_email', 'upsert_contact_phone', 'upsert_contact_social_media',
  // ── Contact Outros ──
  'export_contacts_csv', 'get_birthday_contacts',
  // ── Company CRUD ──
  'soft_delete_company', 'create_company',
  'merge_companies', 'export_companies_csv',
  // ── Company Intelligence ──
  'get_company_health_score', 'get_company_360_view', 'advanced_company_search',
  'get_company_timeline', 'calculate_company_health_score',
  'get_next_best_action', 'get_account_plan',
  'calculate_churn_risk', 'calculate_propensity_score',
  'get_key_contacts', 'get_touchpoint_summary',
  'get_strategic_accounts',
  // ── Company Tags ──
  'get_all_tags', 'add_company_tag', 'get_companies_by_tag',
  // ── Company Upserts ──
  'upsert_company_email', 'upsert_company_phone', 'upsert_company_social_media', 'upsert_company_address',
  // ── Deals / Pipeline ──
  'create_deal', 'get_deals_pipeline', 'get_pipeline_summary',
  'get_weighted_forecast', 'get_stage_velocity', 'get_stalled_deals',
  'get_velocity_metrics', 'move_deal_to_stage', 'mark_deal_lost',
  'predict_close_date',
  // ── Interactions ──
  'create_quick_interaction', 'get_interaction_history', 'get_pending_followups',
  'complete_followup', 'get_activity_heatmap', 'get_optimal_contact_windows',
  'get_unified_communication_history', 'add_quick_note',
  // ── Reports & Analytics ──
  'get_rfm_dashboard', 'get_rfm_segments', 'get_cohort_analysis',
  'get_seasonality_analysis', 'compare_periods', 'get_yoy_comparison',
  'get_conversion_funnel', 'get_pareto_customers', 'get_pareto_summary',
  'generate_monthly_report', 'get_trend_analysis',
  'get_loss_reason_analysis', 'analyze_loss_patterns',
  'get_industry_analysis', 'get_channel_analysis',
  'get_churn_risk_report', 'generate_daily_insights',
  'generate_seller_report', 'generate_pipeline_report',
  // ── Metas & Gamificação ──
  'get_user_goals', 'get_goals_dashboard', 'get_quota_status',
  'get_leaderboard', 'get_user_badges', 'check_and_award_badges',
  // ── Tasks & Reminders ──
  'create_task', 'get_pending_tasks', 'get_overdue_tasks',
  'create_reminder', 'snooze_reminder', 'complete_task',
  'get_tasks_by_contact', 'get_all_tasks',
  // ── Territories ──
  'get_territories', 'create_territory', 'update_territory',
  'get_territory_performance', 'assign_territory',
  // ── Seller / Team ──
  'get_seller_efficiency', 'compare_seller_efficiency',
    'get_performance_benchmark', 'get_coaching_suggestions',
    'prioritize_daily_tasks', 'get_batch_next_actions',
    // ── Search ──
    'unified_search', 'quick_search', 'search_by_cnpj',
    'autocomplete_companies', 'fuzzy_search_companies',
    // ── Data Quality ──
    'find_invalid_cnpjs', 'find_duplicate_emails', 'find_duplicate_companies',
    'get_data_quality_report', 'get_incomplete_companies',
    // ── Logs & Approvals ──
    'get_ai_recommendation_logs', 'approve_follow_up', 'reject_follow_up',
  ] as const;

type AllowedRpc = typeof ALLOWED_RPCS[number];

function isAllowedRpc(name: string): name is AllowedRpc {
  return ALLOWED_RPCS.includes(name as AllowedRpc);
}

const ALLOWED_TABLES = [
  // ── Core tables ──
  'companies', 'contacts', 'interactions', 'insights', 'alerts',
  'activities', 'life_events', 'contact_phones', 'contact_emails',
  'contact_addresses', 'contact_social_media', 'contact_relatives',
  'contact_cadence', 'contact_preferences', 'contact_time_analysis',
  'communication_preferences', 'client_values', 'decision_criteria',
  'disc_analysis_history', 'disc_communication_logs', 'disc_conversion_metrics',
  'disc_profile_config', 'eq_analysis_history', 'cognitive_bias_history',
  'emotional_anchors', 'emotional_states_history', 'hidden_objections',
  'health_alerts', 'health_alert_settings', 'compatibility_alerts',
  'compatibility_settings', 'automation_rules', 'automation_logs',
  'favorite_templates', 'lux_intelligence', 'metaprogram_analysis',
  'vak_analysis_history', 'rfm_analysis', 'offer_suggestions',
  'trigger_bundles', 'trigger_intensity_history',
  'company_phones', 'company_emails', 'company_addresses',
  'company_social_media', 'company_cnaes', 'company_rfm_scores',
  'company_stakeholder_map',
  // ── WhatsApp & Sales ──
  'whatsapp_messages', 'sales_activities',
  // ── Logs & Approvals ──
  'ai_recommendation_logs', 'follow_up_approvals',
  // ── Materialized views & KPIs ──
  'mv_daily_kpis', 'mv_daily_stats', 'v_daily_kpis',
  // ── Contact intelligence & analytics ──
  'churn_predictions', 'deal_velocity_analysis',
  'relationship_score_history', 'workspace_accounts',
  // ── Commercial & CRM ──
  'deals', 'proposals', 'meetings', 'tasks',
  'email_logs', 'nps_surveys', 'cadence_enrollments', 'inactivity_alerts',
  // ── Views (read-only, pre-computed intelligence) ──
  'vw_active_alerts', 'vw_best_closing_moments', 'vw_churn_risk_ranking',
  'vw_closing_score_alerts', 'vw_closing_score_ranking',
  'vw_communication_dashboard', 'vw_contact_social_media',
  'vw_contacts_completo', 'vw_contacts_contato', 'vw_contacts_full',
  'vw_contacts_sem_apelido', 'vw_deal_velocity_benchmark',
  'vw_deals_full', 'vw_disc_compatibility', 'vw_emotional_trend_by_contact',
  'vw_eq_dashboard', 'vw_eq_evolution', 'vw_interacoes_sem_apelido',
  'vw_interaction_timeline', 'vw_leads_full', 'vw_pending_followups',
  'vw_pending_notifications', 'vw_rapport_points', 'vw_satisfaction_trend',
  'vw_search_contacts', 'vw_singu_communication_intel',
  'vw_singu_contact_360', 'vw_singu_emotional_trend',
  'vw_singu_rapport_intel', 'vw_todays_reminders',
  // ── Extended views ──
  'vw_companies_completo', 'vw_companies_duplicatas',
  'vw_companies_stats', 'vw_companies_contato', 'vw_companies_cores',
  'v_company_summary', 'vw_company_addresses', 'vw_company_social_media',
  'vw_singu_data_health', 'vw_singu_disc_dashboard', 'vw_singu_usage_kpis',
  // ── Company cadences ──
  'company_cadences',
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 50;
const STATEMENT_TIMEOUT_MS = 15000;

function getExternalClient() {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const key = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('External database credentials not configured');
  return createClient(url, key, {
    db: { schema: 'public' },
    global: { headers: { 'x-statement-timeout': String(STATEMENT_TIMEOUT_MS) } },
  });
}

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

function clampRange(range?: { from: number; to: number }): { from: number; to: number } {
  const from = Math.max(0, range?.from ?? 0);
  const to = Math.min(range?.to ?? from + DEFAULT_PAGE_SIZE - 1, from + MAX_PAGE_SIZE - 1);
  return { from, to };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries && lastError.message.includes('statement timeout')) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsAndMethod(req);
  if (corsResponse) {
    return corsResponse;
  }

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "external-data");

  // ── Auth guard ──
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  // ── Rate limit guard (per user, not IP) ──
  const limited = limiter.check(userId);
  if (limited) return limited;

  const startTime = performance.now();

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 400, req);
    }

    const action = typeof body.action === 'string' ? body.action : undefined;
    const table = typeof body.table === 'string' ? body.table : undefined;
    const operation = action || 'select';

    log.info("request_received", { method: req.method, action: operation, table });

    // ─── WHOAMI (debug — exposes only the external DB host, never keys) ───
    if (operation === 'whoami') {
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || '';
      let host = '';
      let ref = '';
      try {
        const u = new URL(extUrl);
        host = u.host;
        ref = u.host.split('.')[0] || '';
      } catch {
        host = 'INVALID_URL';
      }
      const hasKey = !!Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
      return jsonOk({ host, ref, hasServiceRoleKey: hasKey }, req);
    }

    // ─── LIST TABLES (schema discovery) ───
    if (operation === 'list_tables') {
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
      });
      const swagger = await resp.json();
      const tableNames = swagger?.definitions
        ? Object.keys(swagger.definitions)
        : swagger?.paths
          ? Object.keys(swagger.paths).map((p: string) => p.replace('/', ''))
          : [];
      return jsonOk({ tables: tableNames }, req);
    }

    // ─── FULL SCHEMA INTROSPECTION ───
    if (operation === 'schema') {
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
      });
      const swagger = await resp.json();
      
      const tables: Record<string, { columns: { name: string; type: string; format: string; required: boolean; description?: string }[] }> = {};
      
      if (swagger?.definitions) {
        for (const [tableName, def] of Object.entries(swagger.definitions)) {
          const d = def as Record<string, unknown>;
          const props = (d.properties || {}) as Record<string, Record<string, unknown>>;
          const required = (d.required || []) as string[];
          const columns = Object.entries(props).map(([colName, colDef]) => ({
            name: colName,
            type: (colDef.type as string) || (colDef.anyOf ? 'nullable' : 'unknown'),
            format: (colDef.format as string) || '',
            required: required.includes(colName),
            ...(colDef.description ? { description: colDef.description as string } : {}),
            ...(colDef.default !== undefined ? { default: colDef.default } : {}),
            ...(colDef.maxLength ? { maxLength: colDef.maxLength } : {}),
            ...(colDef.enum ? { enum: colDef.enum } : {}),
          }));
          tables[tableName] = { columns };
        }
      }

      let functions: string[] = [];
      try {
        const rpcResp = await fetch(`${extUrl}/rest/v1/rpc/`, {
          headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
        });
        if (rpcResp.ok) {
          const rpcData = await rpcResp.json();
          functions = Array.isArray(rpcData) ? rpcData : Object.keys(rpcData || {});
        }
      } catch { /* ignore */ }

      return jsonOk({ tableCount: Object.keys(tables).length, tables, functions }, req);
    }

    // ─── DISTINCT VALUES (single column) ───
    if (operation === 'distinct') {
      const { column } = body;
      if (!table || !isAllowedTable(table)) return jsonError('Invalid table', 400, req);
      if (!column || typeof column !== 'string') return jsonError('Missing "column" for distinct', 400, req);

      const client = getExternalClient();
      const query = client
        .from(table)
        .select(column)
        .not(column, 'is', null)
        .order(column, { ascending: true })
        .limit(5000);

      const { data, error } = await query;

      if (error) throw new Error(`Distinct failed: ${error.message}`);

      const unique = [...new Set((data as any[] || []).map((r: any) => r[column]).filter(Boolean))].sort();
      return jsonOk({ values: unique, count: unique.length }, req);
    }

    // ─── BATCH DISTINCT VALUES (multiple columns in one call) ───
    if (operation === 'batch_distinct') {
      const { columns } = body;
      if (!table || !isAllowedTable(table)) return jsonError('Invalid table', 400, req);
      if (!Array.isArray(columns) || columns.length === 0) return jsonError('Missing "columns" array for batch_distinct', 400, req);
      if (columns.length > 20) return jsonError('Max 20 columns per batch', 400, req);

      const client = getExternalClient();
      const results: Record<string, string[]> = {};

      // Run all distinct queries in parallel
      const promises = columns.map(async (col: string) => {
        try {
          const { data, error } = await client
            .from(table)
            .select(col)
            .not(col, 'is', null)
            .order(col, { ascending: true })
            .limit(5000);
          if (error) {
            log.warn("batch_distinct column failed", { col, error: error.message });
            return { col, values: [] };
          }
          const unique = [...new Set((data as any[] || []).map((r: any) => r[col]).filter(Boolean))].sort();
          return { col, values: unique };
        } catch (err) {
          log.warn("batch_distinct column threw", { col, error: err instanceof Error ? err.message : String(err) });
          return { col, values: [] };
        }
      });

      const settled = await Promise.all(promises);
      for (const { col, values } of settled) {
        results[col] = values;
      }

      return jsonOk({ results }, req);
    }

    const client = getExternalClient();

    // ─── RPC (call external database functions) — must run BEFORE table validation ───
    if (operation === 'rpc') {
      const functionName = typeof body.functionName === 'string' ? body.functionName : undefined;
      if (!functionName || !isAllowedRpc(functionName)) {
        return jsonError(`Invalid or disallowed RPC: "${functionName}"`, 400, req);
      }

      const params = (body.params && typeof body.params === 'object') ? body.params : {};

      const { data, error } = await client.rpc(functionName, params as Record<string, unknown>);
      if (error) {
        log.warn("RPC failed", { rpc: functionName, error: error.message });
        return jsonOk({ data: null, error: `RPC ${functionName} failed: ${error.message}` }, req);
      }
      return jsonOk({ data }, req);
    }

    // ─── Table validation (for non-RPC actions) ───
    if (!table || typeof table !== 'string' || !isAllowedTable(table)) {
      return jsonError(`Invalid table "${table}". Only allowed tables are permitted.`, 400, req);
    }

    // ─── SELECT (read) ───
    if (operation === 'select') {
      const { filters, select, order, range, search, countMethod } = body;

      const result = await withRetry(async () => {
        // Use 'any' for dynamic external DB queries to avoid TS2589 deep type instantiation
        const countMode = countMethod === 'planned' ? 'planned' : 'exact';
        let query: any = client.from(table).select(select || '*', { count: countMode });

        if (search?.term && typeof search.term === 'string' && search.term.trim()) {
          const term = `%${search.term.trim()}%`;
          const columns: string[] = Array.isArray(search.columns) ? search.columns : [];
          if (columns.length > 0) {
            query = query.or(columns.map((col: string) => `${col}.ilike.${term}`).join(','));
          }
        }

        if (Array.isArray(filters)) {
          for (const f of filters) {
            if (!f.column || !f.type) continue;
            // Guard: skip filters with non-primitive values (objects/arrays except for 'in')
            if (f.type !== 'in' && typeof f.value === 'object' && f.value !== null) {
              log.warn("skipping filter with object value", { column: f.column, type: f.type });
              continue;
            }
            const fn = query[f.type];
            if (typeof fn === 'function') {
              query = fn.call(query, f.column, f.value);
            }
          }
        }

        if (order?.column) query = query.order(order.column, { ascending: order.ascending ?? false });
        const clamped = clampRange(range);
        query = query.range(clamped.from, clamped.to);

        const { data, error, count } = await query as unknown as { data: unknown[]; error: { message: string } | null; count: number };
        if (error) throw new Error(`Select failed: ${error.message}`);
        return { data: data || [], count };
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (elapsed > 5000) {
        log.warn("slow query", { table, elapsed_ms: elapsed });
      }

      return jsonOk(result, req);
    }

    // ─── INSERT (create) ───
    if (operation === 'insert') {
      const { record } = body;
      if (!record || typeof record !== 'object') return jsonError('Missing or invalid "record" for insert', 400, req);

      // Inject user_id so records are always tenant-scoped
      const safeRecord = { ...(record as Record<string, unknown>), user_id: userId };
      const { data, error } = await client.from(table).insert(safeRecord).select().single();
      if (error) throw new Error(`Insert failed: ${error.message}`);
      return jsonOk({ data }, req);
    }

    // ─── UPDATE ───
    if (operation === 'update') {
      const id = body.id;
      const updates = body.updates;
      if (!id || typeof id !== 'string') return jsonError('Missing or invalid "id" for update', 400, req);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) return jsonError('Invalid UUID format for "id"', 400, req);
      if (!updates || typeof updates !== 'object') return jsonError('Missing or invalid "updates" for update', 400, req);

      // user_id filter prevents updating another tenant's record
      const { data, error } = await client.from(table).update(updates).eq('id', id).eq('user_id', userId).select().single();
      if (error) throw new Error(`Update failed: ${error.message}`);
      return jsonOk({ data }, req);
    }

    // ─── UPDATE WITH VERSION (Optimistic Locking) ───
    if (operation === 'update_with_version') {
      const id = typeof body.id === 'string' ? body.id : undefined;
      const version = typeof body.version === 'number' ? body.version : undefined;
      const updates = body.updates;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) return jsonError('Invalid "id" for update_with_version', 400, req);
      if (version === undefined || !Number.isFinite(version)) return jsonError('Missing or invalid "version" (number) for update_with_version', 400, req);
      if (!updates || typeof updates !== 'object') return jsonError('Missing or invalid "updates" for update_with_version', 400, req);

      // Conditional update: only succeeds if version matches AND record belongs to this user.
      // The DB trigger increments version automatically on UPDATE.
      const { data, error } = await client
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .eq('version', version)
        .select();

      if (error) throw new Error(`update_with_version failed: ${error.message}`);

      const rows = Array.isArray(data) ? data : [];
      const conflict = assertVersionMatch(rows, { entity: table, id, attemptedVersion: version, req });
      if (conflict) {
        log.warn("concurrent_edit_detected", { table, id, attemptedVersion: version });
        return conflict;
      }
      return jsonOk({ data: rows[0] }, req);
    }

    // ─── DELETE ───
    if (operation === 'delete') {
      const id = body.id;
      if (!id || typeof id !== 'string') return jsonError('Missing or invalid "id" for delete', 400, req);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id as string)) return jsonError('Invalid UUID format for "id"', 400, req);

      // user_id filter prevents deleting another tenant's record
      const { error } = await client.from(table).delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error(`Delete failed: ${error.message}`);
      return jsonOk({ success: true }, req);
    }

    return jsonError(`Unknown action: ${operation}`, 400, req);

  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error("uncaught error", { elapsed_ms: elapsed, message });

    // ── Schema drift detection ──
    const isSchemaDrift = /PGRST|column.*not found|relation.*does not exist|function.*does not exist|could not find/i.test(message);
    const extraHeaders: Record<string, string> = {};

    if (isSchemaDrift) {
      extraHeaders['X-Schema-Drift'] = 'true';
      try {
        const svcClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        const body = await req.clone().json().catch(() => ({}));
        const entityName = body?.table || body?.functionName || 'unknown';
        const entityType = body?.action === 'rpc' ? 'rpc' : 'table';
        const errorType = message.includes('column') ? 'missing_column'
          : message.includes('function') ? 'rpc_error'
          : 'type_mismatch';

        await svcClient.from('schema_drift_alerts').insert({
          error_type: errorType,
          entity_type: entityType,
          entity_name: entityName,
          error_message: message.slice(0, 500),
          stack_trace: (error instanceof Error ? error.stack : null)?.slice(0, 1000) ?? null,
        });
        log.warn("schema drift logged", { errorType, entityType, entityName });
      } catch (logErr) {
        log.error("schema drift log failed", { error: logErr instanceof Error ? logErr.message : String(logErr) });
      }
    }

    // ── Upstream gateway failure (Cloudflare 502/503/504 HTML) ──
    const isUpstreamGateway = /502 Bad Gateway|503 Service|504 Gateway|cloudflare|<html/i.test(message);
    if (isUpstreamGateway) {
      log.warn("upstream gateway failure — returning fallback", { message: message.slice(0, 200) });
      // Return 200 with fallback flag so client degrades gracefully and circuit breaker does not trip on transient upstream blips
      return jsonOk({ error: 'SERVICE_UNAVAILABLE', fallback: true, data: [], count: 0 }, req);
    }

    const status = message.includes('timeout') ? 504 : 500;
    return jsonError(message, status, req);
  }
});