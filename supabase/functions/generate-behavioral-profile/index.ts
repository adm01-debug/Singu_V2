import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardBody, scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";


interface Body { contact_id: string }

const SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Resumo executivo do perfil em PT-BR (2-3 frases).' },
    tone: { type: 'string', description: 'Tom de comunicação predominante em PT-BR (ex: formal, informal, direto, cordial).' },
    communication_style: { type: 'string', description: 'Estilo (ex: analítico, expressivo, pragmático).' },
    sentiment_trend: { type: 'string', enum: ['positive', 'neutral', 'negative', 'mixed'] },
    preferences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['label'],
      },
    },
    hobbies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['label'],
      },
    },
    recurrent_topics: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['summary', 'tone', 'communication_style', 'preferences', 'hobbies', 'recurrent_topics'],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  try {
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalKey = req.headers.get('x-internal-key') ?? '';
    const isInternal = internalKey && internalKey === SERVICE_KEY;

    const body = rawBody as Partial<Body> & { user_id?: string };
    if (!body.contact_id || typeof body.contact_id !== 'string') {
      return json({ error: 'contact_id obrigatório' }, 400);
    }

    let userId: string | null = null;
    let supabase;

    if (isInternal) {
      supabase = createClient(Deno.env.get('SUPABASE_URL')!, SERVICE_KEY);
      if (body.user_id) {
        userId = body.user_id;
      } else {
        const { data: c } = await supabase.from('contacts').select('user_id').eq('id', body.contact_id).maybeSingle();
        userId = (c as { user_id?: string } | null)?.user_id ?? null;
      }
      if (!userId) return json({ error: 'contato não encontrado' }, 404);
    } else {
      const authHeader = req.headers.get('Authorization') ?? '';
      if (!authHeader) return json({ error: 'Não autenticado' }, 401);
      supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return json({ error: 'Não autenticado' }, 401);
      userId = userData.user.id;
    }

    // Coleta histórico (RLS aplica escopo do usuário)
    const [wa, calls, ints] = await Promise.all([
      supabase.from('whatsapp_messages')
        .select('content, from_me, message_type, timestamp')
        .eq('contact_id', body.contact_id)
        .order('timestamp', { ascending: false })
        .limit(80),
      supabase.from('call_logs')
        .select('direction, status, duration_seconds, transcription, summary, sentiment, created_at')
        .eq('contact_id', body.contact_id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('interactions')
        .select('type, title, content, transcription, sentiment, initiated_by, created_at')
        .eq('contact_id', body.contact_id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const total = (wa.data?.length ?? 0) + (calls.data?.length ?? 0) + (ints.data?.length ?? 0);
    if (total === 0) return json({ error: 'Sem histórico suficiente para gerar perfil' }, 422);

    const lines: string[] = [];
    for (const m of (wa.data ?? [])) {
      const who = m.from_me ? 'NÓS' : 'ELE/ELA';
      const c = (m.content || (m.message_type === 'audio' ? '[áudio]' : '')).slice(0, 400);
      if (c) lines.push(`[WhatsApp ${m.timestamp?.slice(0, 10)}] ${who}: ${c}`);
    }
    for (const c of (calls.data ?? [])) {
      const t = (c.summary || c.transcription || '').slice(0, 800);
      if (t) lines.push(`[Ligação ${c.direction ?? '-'} ${c.created_at?.slice(0, 10)} · ${c.duration_seconds ?? 0}s · ${c.sentiment ?? ''}]: ${t}`);
    }
    for (const i of (ints.data ?? [])) {
      const t = (i.content || i.transcription || i.title || '').slice(0, 800);
      if (t) lines.push(`[${i.type} ${i.created_at?.slice(0, 10)} · ${i.initiated_by ?? ''} · ${i.sentiment ?? ''}] ${i.title ?? ''}: ${t}`);
    }

    const transcript = lines.slice(0, 180).join('\n').slice(0, 24000);

    // Feedback negativo do usuário — insights recusados repetidamente devem ser evitados.
    // Consideramos label "banido" se o próprio usuário votou -1, ou se há >=3 votos negativos globais
    // sem votos positivos posteriores. Fazemos duas consultas (do usuário + globais) e mesclamos.
    const banned: { preference: Set<string>; hobby: Set<string>; tone: Set<string> } = {
      preference: new Set(), hobby: new Set(), tone: new Set(),
    };
    try {
      const { data: mine } = await supabase
        .from('behavioral_insight_feedback')
        .select('insight_kind, insight_label, vote')
        .eq('contact_id', body.contact_id)
        .eq('user_id', userId!)
        .eq('vote', -1);
      for (const r of (mine ?? []) as Array<{ insight_kind: string; insight_label: string }>) {
        const k = r.insight_kind as 'preference' | 'hobby' | 'tone';
        if (k in banned) banned[k].add(r.insight_label.trim().toLowerCase());
      }
    } catch (e) { console.warn('Failed to load banned insights (non-critical):', (e as Error).message); }

    const bannedHint = (['preference', 'hobby', 'tone'] as const)
      .flatMap((k) => Array.from(banned[k]).map((l) => `- ${k}: "${l}"`))
      .join('\n');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const model = 'google/gemini-2.5-flash';
    const aiResp = await fetchAI('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: (() => {
              const bannedNote = bannedHint
                ? '\n\nO usuário JÁ marcou os seguintes insights como imprecisos para este contato — NÃO os proponha novamente (a menos que exista nova evidência clara e diferente):\n' + bannedHint
                : '';
              return `Você é um analista comportamental sênior. Gere insights SOMENTE em português (PT-BR), baseados exclusivamente em evidências do histórico fornecido. Nunca invente dados. Se não houver evidência para um campo, deixe a lista vazia. Foque em preferências verificáveis, hobbies mencionados e tom real de comunicação.${bannedNote}`;
            })(),
          },
          {
            role: 'user',
            content: `Analise o histórico de interações a seguir e gere o perfil comportamental estruturado.\n\n---\n${transcript}\n---`,
          },
        ],
        tools: [{ type: 'function', function: { name: 'submit_profile', description: 'Perfil comportamental extraído.', parameters: SCHEMA } }],
        tool_choice: { type: 'function', function: { name: 'submit_profile' } },
      }),
    });

    if (aiResp.status === 429) return json({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }, 429);
    if (aiResp.status === 402) return json({ error: 'Créditos de IA esgotados. Adicione créditos ao workspace.' }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      return json({ error: `Falha no gateway de IA: ${t.slice(0, 200)}` }, 502);
    }

    const aiJson = await aiResp.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return json({ error: 'Resposta de IA inválida' }, 502);

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(call.function.arguments); }
    catch { return json({ error: 'JSON de IA inválido' }, 502); }

    // Guard-rail final: remove qualquer insight banido que a IA tenha reproduzido mesmo assim.
    const filterList = (arr: unknown, kind: 'preference' | 'hobby'): unknown[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((it) => {
        const label = (it as { label?: unknown })?.label;
        if (typeof label !== 'string') return false;
        return !banned[kind].has(label.trim().toLowerCase());
      });
    };
    parsed.preferences = filterList(parsed.preferences, 'preference');
    parsed.hobbies = filterList(parsed.hobbies, 'hobby');
    if (typeof parsed.tone === 'string' && banned.tone.has((parsed.tone as string).trim().toLowerCase())) {
      parsed.tone = null;
    }

    const row = {
      contact_id: body.contact_id,
      user_id: userId,
      preferences: parsed.preferences ?? [],
      hobbies: parsed.hobbies ?? [],
      recurrent_topics: parsed.recurrent_topics ?? [],
      communication_style: parsed.communication_style ?? null,
      sentiment_trend: parsed.sentiment_trend ?? null,
      tone: parsed.tone ?? null,
      summary: parsed.summary ?? null,
      based_on_count: total,
      model,
      last_updated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = await supabase
      .from('contact_analytical_profiles')
      .upsert(row, { onConflict: 'contact_id' })
      .select()
      .single();

    if (upErr) return json({ error: `Falha ao salvar: ${upErr.message}` }, 500);

    // Snapshot de versão (best-effort — não falha a chamada se a inserção do histórico der erro)
    try {
      await supabase.from('contact_analytical_profile_versions').insert({
        contact_id: body.contact_id,
        user_id: userId,
        profile_id: (saved as { id?: string } | null)?.id ?? null,
        summary: row.summary,
        tone: row.tone,
        communication_style: row.communication_style,
        sentiment_trend: row.sentiment_trend,
        preferences: row.preferences,
        hobbies: row.hobbies,
        recurrent_topics: row.recurrent_topics,
        based_on_count: row.based_on_count,
        model: row.model,
        trigger_source: isInternal ? 'auto' : 'manual',
        generated_at: row.last_updated_at,
      });
    } catch (e) {
      console.warn('Snapshot save failed (non-critical):', (e as Error).message);
    }

    return json({ profile: saved });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
