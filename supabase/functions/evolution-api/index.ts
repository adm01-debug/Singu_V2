import { z } from "npm:zod@3.23.8";
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
  guardBody,
} from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

interface EvolutionRequest {
  action: string;
  instanceName?: string;
  remoteJid?: string;
  message?: string;
  phoneNumber?: string;
  limit?: number;
  body?: Record<string, unknown>;
}

const ALLOWED_ACTIONS = new Set([
  'list-instances', 'instance-info', 'instance-detail', 'create-instance',
  'connect-instance', 'restart-instance', 'logout-instance', 'delete-instance',
  'set-presence', 'send-message', 'send-media', 'send-audio', 'send-location',
  'send-contact', 'send-reaction', 'send-poll', 'send-list', 'send-buttons',
  'send-sticker', 'mark-read', 'mark-unread', 'archive-chat', 'delete-message',
  'edit-message', 'fetch-chats', 'fetch-messages', 'check-number', 'find-contacts',
  'download-media', 'list-groups', 'group-info', 'group-participants',
  'create-group', 'update-group-participants', 'fetch-profile',
  'fetch-profile-picture', 'fetch-business-profile', 'list-labels',
  'handle-label', 'set-webhook', 'find-webhook', 'set-settings', 'find-settings',
]);

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const { body: rawBody, error: bodyError } = await guardBody(req, 128 * 1024);
  if (bodyError) return bodyError;

  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API credentials not configured');
    }

    const baseUrl = evolutionUrl.replace(/\/$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': evolutionKey,
    };

    const EvolutionInput = z.object({
      action: z.string().min(1).refine(a => ALLOWED_ACTIONS.has(a), { message: "Ação desconhecida ou não permitida" }),
      instanceName: z.string().optional(),
      remoteJid: z.string().optional(),
      message: z.string().optional(),
      phoneNumber: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(20),
      body: z.record(z.unknown()).optional(),
    });

    const parsed = EvolutionInput.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(`Entrada inválida: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400);
    }
    const { action, instanceName, remoteJid, message, phoneNumber, limit, body: extraBody } = parsed.data;

    let endpoint = '';
    let method = 'GET';
    let body: string | undefined;

    // eslint-disable-next-line sonarjs/max-switch-cases -- API proxy dispatches 43 action types (product requirement; each is a distinct WhatsApp API endpoint)
    switch (action) {
      case 'list-instances':
        endpoint = '/instance/fetchInstances';
        break;

      case 'instance-info':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/connectionState/${encodeURIComponent(instanceName)}`;
        break;

      case 'instance-detail':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`;
        break;

      case 'create-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = '/instance/create';
        method = 'POST';
        body = JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          ...extraBody,
        });
        break;

      case 'connect-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/connect/${encodeURIComponent(instanceName)}`;
        break;

      case 'restart-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/restart/${encodeURIComponent(instanceName)}`;
        method = 'PUT';
        break;

      case 'logout-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/logout/${encodeURIComponent(instanceName)}`;
        method = 'DELETE';
        break;

      case 'delete-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/delete/${encodeURIComponent(instanceName)}`;
        method = 'DELETE';
        break;

      case 'set-presence':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/setPresence/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody || { presence: 'available' });
        break;

      case 'send-message':
        if (!instanceName || !remoteJid || !message) {
          throw new Error('instanceName, remoteJid and message required');
        }
        endpoint = `/message/sendText/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify({
          number: remoteJid.replace('@s.whatsapp.net', ''),
          text: message,
          ...(extraBody || {}),
        });
        break;

      case 'send-media':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendMedia/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-audio':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendWhatsAppAudio/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-location':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendLocation/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-contact':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendContact/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-reaction':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendReaction/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-poll':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendPoll/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-list':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendList/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-buttons':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendButtons/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-sticker':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendSticker/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'mark-read':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/markMessageAsRead/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'mark-unread':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/markMessageAsUnread/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'archive-chat':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/archiveChat/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'delete-message':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/delete/${encodeURIComponent(instanceName)}`;
        method = 'DELETE';
        body = JSON.stringify(extraBody);
        break;

      case 'edit-message':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/update/${encodeURIComponent(instanceName)}`;
        method = 'PUT';
        body = JSON.stringify(extraBody);
        break;

      case 'fetch-chats':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findChats/${encodeURIComponent(instanceName)}`;
        break;

      case 'fetch-messages':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findMessages/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify({
          where: remoteJid ? { key: { remoteJid } } : {},
          limit,
          ...(extraBody || {}),
        });
        break;

      case 'check-number':
        if (!instanceName || !phoneNumber) {
          throw new Error('instanceName and phoneNumber required');
        }
        endpoint = `/chat/whatsappNumbers/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify({
          numbers: Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber],
        });
        break;

      case 'find-contacts':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findContacts/${encodeURIComponent(instanceName)}`;
        break;

      case 'download-media':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/getBase64FromMediaMessage/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'list-groups':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/fetchAllGroups/${encodeURIComponent(instanceName)}`;
        break;

      case 'group-info':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/findGroupInfos/${encodeURIComponent(instanceName)}?groupJid=${encodeURIComponent(String(extraBody?.groupJid || ''))}`;
        break;

      case 'group-participants':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/participants/${encodeURIComponent(instanceName)}?groupJid=${encodeURIComponent(String(extraBody?.groupJid || ''))}`;
        break;

      case 'create-group':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/create/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'update-group-participants':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/updateParticipant/${encodeURIComponent(instanceName)}`;
        method = 'PUT';
        body = JSON.stringify(extraBody);
        break;

      case 'fetch-profile':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/profile/fetchProfile/${encodeURIComponent(instanceName)}`;
        break;

      case 'fetch-profile-picture':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/profile/fetchProfilePicture/${encodeURIComponent(instanceName)}`;
        if (extraBody?.number) {
          endpoint += `?number=${encodeURIComponent(String(extraBody.number))}`;
        }
        break;

      case 'fetch-business-profile':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/profile/fetchBusinessProfile/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'list-labels':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/label/findLabels/${encodeURIComponent(instanceName)}`;
        break;

      case 'handle-label':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/label/handleLabel/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'set-webhook':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/webhook/set/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'find-webhook':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/webhook/find/${encodeURIComponent(instanceName)}`;
        break;

      case 'set-settings':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/settings/set/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'find-settings':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/settings/find/${encodeURIComponent(instanceName)}`;
        break;

      default:
        return jsonError(`Unknown action: ${action}`, 400);
    }

    // Evolution API call logged;

    const response = await fetchAPI(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Evolution API error:', data);
      throw new Error(data.message || data.error || 'Evolution API error');
    }

    return jsonOk({ success: true, data });

  } catch (error) {
    console.error('Evolution API function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(errorMessage, 500);
  }
});
