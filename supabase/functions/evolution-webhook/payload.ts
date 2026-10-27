import { z } from "npm:zod@3.23.8";

const text = z.string().nullish();
const object = z.object({}).passthrough();
const messageKey = z.object({
  id: text,
  remoteJid: text,
  fromMe: z.boolean().nullish(),
}).passthrough();

export const messageUpsertData = z.object({
  key: messageKey.nullish(),
  pushName: text,
  status: text,
  messageTimestamp: z.number().nullish(),
  messageType: text,
  participant: text,
  instanceId: text,
  message: z.object({
    conversation: text,
    extendedTextMessage: z.object({ text }).passthrough().nullish(),
    imageMessage: z.object({ caption: text }).passthrough().nullish(),
    videoMessage: z.object({ caption: text }).passthrough().nullish(),
    audioMessage: object.nullish(),
    documentMessage: z.object({ fileName: text }).passthrough().nullish(),
    stickerMessage: object.nullish(),
    locationMessage: z.object({
      degreesLatitude: z.union([z.number(), z.string()]).nullish(),
      degreesLongitude: z.union([z.number(), z.string()]).nullish(),
    }).passthrough().nullish(),
    contactMessage: z.object({ displayName: text }).passthrough().nullish(),
    reactionMessage: z.object({ text }).passthrough().nullish(),
    pollCreationMessage: z.object({ name: text }).passthrough().nullish(),
  }).passthrough().nullish(),
}).passthrough();

export const messageUpdateData = z.object({
  key: messageKey.nullish(),
  update: z.object({ status: z.union([z.number(), z.string()]).nullish() }).passthrough().nullish(),
}).passthrough();

export const connectionUpdateData = z.object({ state: text }).passthrough();
export const contactsUpsertData = z.object({
  id: text,
  pushName: text,
  name: text,
  profilePictureUrl: text,
}).passthrough();
export const presenceUpdateData = z.object({ id: text }).passthrough();
export const callData = z.object({
  from: text,
  isVideo: z.boolean().nullish(),
  status: text,
}).passthrough();
export const sendMessageData = z.object({ key: messageKey.nullish() }).passthrough();

export function readEventData<S extends z.AnyZodObject>(payload: unknown, schema: S): z.output<S> | undefined {
  const parsed = z.object({ data: z.union([schema, schema.array()]).nullish() })
    .passthrough().safeParse(payload);
  if (!parsed.success || !parsed.data.data || Array.isArray(parsed.data.data)) return undefined;
  return parsed.data.data;
}


export function requireMessageData(payload: unknown): z.output<typeof messageUpsertData> {
  const data = readEventData(payload, messageUpsertData);
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
    return messageUpsertData.parse({});
  }
  if (!data) throw new TypeError('Dados de mensagem inválidos');
  return data;
}

export function requireMessageKey(data: z.output<typeof messageUpsertData>): z.output<typeof messageKey> {
  if (!data.key) throw new TypeError('Chave de mensagem ausente');
  return data.key;
}
