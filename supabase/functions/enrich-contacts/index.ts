import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20, message: "Rate limit exceeded for contact enrichment. Please wait." });

interface EnrichResult {
  contactId: string;
  name: string;
  status: string;
  details?: string;
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- orquestração linear de handler HTTP com muitos guards; refactor rastreado como tech-debt (ADR-020)
Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey) {
      throw new Error('External database credentials not configured');
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    const { data: localContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, whatsapp, company_id, email, role_title, relationship_stage')
      .eq('user_id', userId)
      .or('company_id.is.null,relationship_stage.eq.unknown');

    if (fetchError) {
      console.error('Error fetching local contacts:', fetchError);
      throw new Error('Failed to fetch contacts');
    }

    if (!localContacts || localContacts.length === 0) {
      return jsonOk({ status: 'success', message: 'No contacts to enrich', enriched: 0 }, req);
    }

    console.log(`Found ${localContacts.length} contacts to enrich`);

    // Build phone-variant → local contact map and collect all variants for one batch query
    type LocalContact = typeof localContacts[number];
    const variantToContact = new Map<string, LocalContact>();

    for (const contact of localContacts) {
      const phoneNumber = contact.whatsapp || contact.phone;
      if (!phoneNumber) continue;
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const variants = [cleanPhone];
      if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) variants.push(cleanPhone.substring(2));
      if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) variants.push('55' + cleanPhone);
      for (const v of variants) {
        if (!variantToContact.has(v)) variantToContact.set(v, contact);
      }
    }

    const allVariants = Array.from(variantToContact.keys());

    // One batch external query for ALL phone variants (eliminates N+1)
    type ExtContact = { id: string; company_id: string | null; first_name: string | null; last_name: string | null; cargo: string | null; whatsapp: string | null; phone: string | null; email: string | null };
    const extContactMap = new Map<string, ExtContact>(); // variant → ext contact

    if (allVariants.length > 0) {
      // Use OR filter: whatsapp.in.(...) OR phone.in.(...)
      const { data: extResults } = await externalSupabase
        .from('contacts')
        .select('id, company_id, first_name, last_name, cargo, whatsapp, phone, email')
        .or(`whatsapp.in.(${allVariants.join(',')}),phone.in.(${allVariants.join(',')})`)
        .limit(1000);

      for (const ext of (extResults ?? []) as ExtContact[]) {
        if (ext.whatsapp) extContactMap.set(ext.whatsapp, ext);
        if (ext.phone && !extContactMap.has(ext.phone)) extContactMap.set(ext.phone, ext);
      }
    }

    // In-memory enrichment pass — no DB calls
    const results: EnrichResult[] = [];
    const pendingUpdates: Array<{ id: string; updates: Record<string, unknown> }> = [];

    for (const contact of localContacts) {
      const phoneNumber = contact.whatsapp || contact.phone;
      if (!phoneNumber) {
        results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'skipped', details: 'No phone number' });
        continue;
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const variants = [cleanPhone];
      if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) variants.push(cleanPhone.substring(2));
      if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) variants.push('55' + cleanPhone);

      let extContact: ExtContact | undefined;
      for (const v of variants) {
        extContact = extContactMap.get(v);
        if (extContact) break;
      }

      if (!extContact) {
        results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'not_found', details: `Phone: ${cleanPhone}` });
        continue;
      }

      const updates: Record<string, unknown> = {};
      if (contact.first_name === 'WhatsApp' && extContact.first_name) {
        updates.first_name = extContact.first_name;
        updates.last_name = extContact.last_name || '';
      }
      if (!contact.company_id && extContact.company_id) updates.company_id = extContact.company_id;
      if (!contact.email && extContact.email) updates.email = extContact.email;
      if (!contact.role_title && extContact.cargo) updates.role_title = extContact.cargo;
      if (contact.relationship_stage === 'unknown') updates.relationship_stage = 'known';
      updates.updated_at = new Date().toISOString();

      if (Object.keys(updates).length > 1) {
        pendingUpdates.push({ id: contact.id, updates });
        const enrichedFields = Object.keys(updates).filter(k => k !== 'updated_at');
        results.push({ contactId: contact.id, name: (extContact.first_name) || contact.first_name, status: 'enriched', details: `Fields: ${enrichedFields.join(', ')}` });
      } else {
        results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'already_complete', details: 'External match found but no new data' });
      }
    }

    // Bulk-upsert all pending updates in one call (each row has different fields → upsert with merge)
    let enrichedCount = 0;
    let errorCount = 0;

    if (pendingUpdates.length > 0) {
      const upsertRows = pendingUpdates.map(({ id, updates }) => ({ id, user_id: userId, ...updates }));
      const { error: upsertErr } = await supabase
        .from('contacts')
        .upsert(upsertRows, { onConflict: 'id' });

      if (upsertErr) {
        console.error('Bulk upsert error:', upsertErr);
        errorCount = pendingUpdates.length;
        for (const p of pendingUpdates) {
          const idx = results.findIndex(r => r.contactId === p.id);
          if (idx >= 0) results[idx] = { ...results[idx], status: 'error', details: 'Update failed' };
        }
      } else {
        enrichedCount = pendingUpdates.length;
      }
    }

    console.log(`Enrichment complete: ${enrichedCount} enriched, ${errorCount} errors, ${localContacts.length} total`);

    return jsonOk({
      status: 'success',
      total: localContacts.length,
      enriched: enrichedCount,
      errors: errorCount,
      results,
    }, req);

  } catch (error) {
    console.error('Enrich contacts error:', error);
    return jsonError('Internal server error', 500, req);
  }
});
