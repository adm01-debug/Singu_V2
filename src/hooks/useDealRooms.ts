import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DealRoomStatus = "active" | "won" | "lost" | "paused";
export type MilestoneStatus = "pending" | "in_progress" | "done" | "blocked";
export type Side = "seller" | "buyer" | "both";

export interface DealRoom {
  id: string;
  user_id: string;
  deal_id: string | null;
  deal_name: string | null;
  company_id: string | null;
  title: string;
  description: string | null;
  status: DealRoomStatus;
  deal_value: number | null;
  target_close_date: string | null;
  share_token: string;
  share_enabled: boolean;
  last_buyer_view_at: string | null;
  buyer_view_count: number;
  health_score: number | null;
  health_recommendations: string[];
  health_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealRoomMilestone {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  sort_order: number;
  due_date: string | null;
  completed_at: string | null;
  completed_by_side: Side | null;
  owner_side: Side | null;
  created_at: string;
  updated_at: string;
}

export interface DealRoomStakeholder {
  id: string;
  room_id: string;
  user_id: string;
  contact_id: string | null;
  name: string;
  email: string | null;
  role_title: string | null;
  side: Side;
  influence: string | null;
  engagement_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealRoomDocument {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by_side: Side;
  created_at: string;
}

export interface DealRoomActivity {
  id: string;
  room_id: string;
  activity_type: string;
  actor_side: Side;
  actor_label: string;
  payload: any;
  created_at: string;
}

export interface DealRoomComment {
  id: string;
  room_id: string;
  user_id: string | null;
  author_side: Side;
  author_label: string;
  body: string;
  created_at: string;
}

const KEYS = {
  rooms: ["deal_rooms"] as const,
  room: (id: string) => ["deal_rooms", id] as const,
  ms: (rid: string) => ["deal_rooms", rid, "milestones"] as const,
  sh: (rid: string) => ["deal_rooms", rid, "stakeholders"] as const,
  docs: (rid: string) => ["deal_rooms", rid, "documents"] as const,
  acts: (rid: string) => ["deal_rooms", rid, "activities"] as const,
  cmts: (rid: string) => ["deal_rooms", rid, "comments"] as const,
  publicRoom: (token: string) => ["deal_rooms", "public", token] as const,
};

export function useDealRooms(filters?: { status?: DealRoomStatus | "all" }) {
  return useQuery({
    queryKey: [...KEYS.rooms, filters?.status ?? "all"],
    queryFn: async () => {
      let q = supabase.from("deal_rooms").select("*").order("updated_at", { ascending: false });
      if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DealRoom[];
    },
  });
}

export function useDealRoom(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.room(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_rooms").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as DealRoom | null;
    },
  });
}

export function useCreateDealRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; deal_name?: string; deal_id?: string; company_id?: string; target_close_date?: string; deal_value?: number; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("deal_rooms").insert({
        user_id: user.id,
        title: payload.title,
        deal_name: payload.deal_name ?? null,
        deal_id: payload.deal_id ?? null,
        company_id: payload.company_id ?? null,
        target_close_date: payload.target_close_date ?? null,
        deal_value: payload.deal_value ?? null,
        description: payload.description ?? null,
      }).select("*").single();
      if (error) throw error;
      return data as DealRoom;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rooms });
      toast.success("Deal Room criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDealRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DealRoom> & { id: string }) => {
      const { data, error } = await supabase.from("deal_rooms").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data as DealRoom;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEYS.rooms });
      qc.invalidateQueries({ queryKey: KEYS.room(d.id) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDealRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rooms });
      toast.success("Deal Room excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// MILESTONES
export function useMilestones(roomId: string | undefined) {
  return useQuery({
    queryKey: KEYS.ms(roomId ?? ""),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_room_milestones").select("*").eq("room_id", roomId!).order("sort_order");
      if (error) throw error;
      return (data ?? []) as DealRoomMilestone[];
    },
  });
}

export function useUpsertMilestone(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<DealRoomMilestone>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const payload = { ...m, room_id: roomId, user_id: user.id };
      const { data, error } = await supabase.from("deal_room_milestones").upsert(payload as any).select("*").single();
      if (error) throw error;
      return data as unknown as DealRoomMilestone;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.ms(roomId) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMilestone(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_room_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.ms(roomId) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// STAKEHOLDERS
export function useStakeholders(roomId: string | undefined) {
  return useQuery({
    queryKey: KEYS.sh(roomId ?? ""),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_room_stakeholders").select("*").eq("room_id", roomId!);
      if (error) throw error;
      return (data ?? []) as unknown as DealRoomStakeholder[];
    },
  });
}

export function useUpsertStakeholder(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<DealRoomStakeholder>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const payload = { ...s, room_id: roomId, user_id: user.id };
      const { data, error } = await supabase.from("deal_room_stakeholders").upsert(payload as any).select("*").single();
      if (error) throw error;
      return data as unknown as DealRoomStakeholder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.sh(roomId) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStakeholder(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_room_stakeholders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.sh(roomId) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// DOCUMENTS
export function useRoomDocuments(roomId: string | undefined) {
  return useQuery({
    queryKey: KEYS.docs(roomId ?? ""),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_room_documents").select("*").eq("room_id", roomId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealRoomDocument[];
    },
  });
}

export function useUploadDocument(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const path = `deal-rooms/${roomId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("deal_room_documents").insert({
        room_id: roomId, user_id: user.id, title: file.name, file_path: path,
        file_type: file.type, file_size: file.size, uploaded_by_side: "seller",
      }).select("*").single();
      if (error) throw error;
      return data as DealRoomDocument;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.docs(roomId) });
      toast.success("Documento enviado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDocument(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase.from("deal_room_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.docs(roomId) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function getDocumentSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

// ACTIVITIES + COMMENTS
export function useRoomActivities(roomId: string | undefined) {
  return useQuery({
    queryKey: KEYS.acts(roomId ?? ""),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_room_activities").select("*").eq("room_id", roomId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as DealRoomActivity[];
    },
  });
}

export function useRoomComments(roomId: string | undefined) {
  return useQuery({
    queryKey: KEYS.cmts(roomId ?? ""),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_room_comments").select("*").eq("room_id", roomId!).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as DealRoomComment[];
    },
  });
}

export function useAddComment(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("deal_room_comments").insert({
        room_id: roomId, user_id: user.id, author_side: "seller", author_label: user.email ?? "Vendedor", body,
      }).select("*").single();
      if (error) throw error;
      return data as DealRoomComment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.cmts(roomId) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// SHARE + HEALTH
export function useShareRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { room_id: string; enabled?: boolean; rotate?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("deal-room-share", { body: args });
      if (error) throw error;
      return data as { token: string; share_enabled: boolean };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.room(vars.room_id) });
      qc.invalidateQueries({ queryKey: KEYS.rooms });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRoomHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (room_id: string) => {
      const { data, error } = await supabase.functions.invoke("deal-room-health", { body: { room_id } });
      if (error) throw error;
      return data as { health_score: number; recommendations: string[] };
    },
    onSuccess: (_d, room_id) => qc.invalidateQueries({ queryKey: KEYS.room(room_id) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// PUBLIC (buyer)
export function usePublicDealRoom(token: string | undefined) {
  return useQuery({
    queryKey: KEYS.publicRoom(token ?? ""),
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_deal_room_by_token", { _token: token! });
      if (error) throw error;
      return data as any as { 
        room: DealRoom; 
        milestones: DealRoomMilestone[]; 
        stakeholders: DealRoomStakeholder[]; 
        documents: DealRoomDocument[]; 
        activities: DealRoomActivity[]; 
        comments: DealRoomComment[]; 
      };
    },
  });
}

export async function recordBuyerView(token: string, label?: string) {
  await supabase.functions.invoke("deal-room-buyer-view", { body: { token, label } });
}

export async function buyerToggleMilestone(token: string, milestone_id: string, done: boolean, label?: string) {
  const { error } = await supabase.rpc("buyer_toggle_milestone", { _token: token, _milestone_id: milestone_id, _done: done, _label: label ?? null });
  if (error) throw error;
}

export async function buyerAddComment(token: string, body: string, label?: string) {
  const { error } = await supabase.rpc("buyer_add_comment", { _token: token, _body: body, _label: label ?? null });
  if (error) throw error;
}

export async function getBuyerDocumentUrl(token: string, document_id: string) {
  const { data: path, error } = await supabase.rpc("get_buyer_document_path", { _token: token, _document_id: document_id });
  if (error || !path) throw error ?? new Error("Documento não encontrado");
  return path as string;
}
