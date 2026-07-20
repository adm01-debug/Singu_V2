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

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  // ── Rate limit ──
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

    // Scope to authenticated user's contacts only
    const { data: localContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, whatsapp, company_id, email, role_title, relationship_stage')
      .eq('user_id', userId)
      .or('company_id.is.null,relationship_stage.eq.unknown');

    if (fetchError) {
      throw new Error(`Error fetching local contacts: ${fetchError.message}`);
    }

    if (!localContacts || localContacts.length === 0) {
      return jsonOk({ status: 'success', message: 'No contacts to enrich', enriched: 0 });
    }

    console.log(`Found ${localContacts.length} contacts to enrich`);

    let enrichedCount = 0;
    let errorCount = 0;
    const results: EnrichResult[] = [];

    for (const contact of localContacts) {
      try {
        const phoneNumber = contact.whatsapp || contact.phone;
        if (!phoneNumber) {
          results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'skipped', details: 'No phone number' });
          continue;
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        const phoneVariants = [cleanPhone];
        if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
          phoneVariants.push(cleanPhone.substring(2));
        }
        if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
          phoneVariants.push('55' + cleanPhone);
        }

        let extContact: Record<string, unknown> | null = null;

        for (const variant of phoneVariants) {
          const { data: extResults, error: extError } = await externalSupabase
            .from('contacts')
            .select('id, company_id, first_name, last_name, cargo, whatsapp, phone, email')
            .or(`whatsapp.eq.${variant},phone.eq.${variant}`)
            .limit(1);

          if (extError) {
            console.error(`External search error for ${variant}:`, extError.message);
            continue;
          }

          if (extResults && extResults.length > 0) {
            extContact = extResults[0] as Record<string, unknown>;
            break;
          }
        }

        if (!extContact) {
          results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'not_found', details: `Phone: ${cleanPhone}` });
          continue;
        }

        const updates: Record<string, unknown> = {};

        if (contact.first_name === 'WhatsApp' && extContact.first_name) {
          updates.first_name = extContact.first_name;
          updates.last_name = (extContact.last_name as string) || '';
        }

        if (!contact.company_id && extContact.company_id) {
          updates.company_id = extContact.company_id;
        }

        if (!contact.email && extContact.email) {
          updates.email = extContact.email;
        }

        if (!contact.role_title && extContact.cargo) {
          updates.role_title = extContact.cargo;
        }

        if (contact.relationship_stage === 'unknown') {
          updates.relationship_stage = 'known';
        }

        updates.updated_at = new Date().toISOString();

        if (Object.keys(updates).length > 1) {
          const { error: updateError } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', contact.id)
            .eq('user_id', userId); // double-check ownership

          if (updateError) {
            console.error(`Error updating contact ${contact.id}:`, updateError.message);
            results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'error', details: updateError.message });
            errorCount++;
          } else {
            enrichedCount++;
            const enrichedFields = Object.keys(updates).filter(k => k !== 'updated_at');
            results.push({ contactId: contact.id, name: (extContact.first_name as string) || contact.first_name, status: 'enriched', details: `Fields: ${enrichedFields.join(', ')}` });
            console.log(`Enriched contact ${contact.id}: ${enrichedFields.join(', ')}`);
          }
        } else {
          results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'already_complete', details: 'External match found but no new data' });
        }

      } catch (contactError) {
        const msg = contactError instanceof Error ? contactError.message : 'Unknown error';
        console.error(`Error processing contact ${contact.id}:`, msg);
        results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'error', details: msg });
        errorCount++;
      }
    }

    console.log(`Enrichment complete: ${enrichedCount} enriched, ${errorCount} errors, ${localContacts.length} total`);

    return jsonOk({
      status: 'success',
      total: localContacts.length,
      enriched: enrichedCount,
      errors: errorCount,
      results,
    });

  } catch (error) {
    console.error('Enrich contacts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(errorMessage, 500);
  }
});
