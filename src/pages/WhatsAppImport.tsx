import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Mic, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EntityPicker } from './cadastro/EntityPicker';
import {
  useImportWhatsAppMessages,
  useWhatsAppMessages,
  uploadWhatsAppAudio,
  type WhatsAppMessageType,
  type WhatsAppImportInput,
} from '@/hooks/useWhatsAppImport';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

type Picked = { id: string; label: string } | null;

export default function WhatsAppImport() {
  const { user } = useAuth();
  const [contact, setContact] = useState<Picked>(null);
  const [company, setCompany] = useState<Picked>(null);
  const [remoteJid, setRemoteJid] = useState('');
  const [senderName, setSenderName] = useState('');
  const [fromMe, setFromMe] = useState(false);
  const [instance, setInstance] = useState('manual');

  const [msgType, setMsgType] = useState<WhatsAppMessageType>('text');
  const [textContent, setTextContent] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [duration, setDuration] = useState('');
  const [transcription, setTranscription] = useState('');

  const importMut = useImportWhatsAppMessages();
  const [uploading, setUploading] = useState(false);

  const { data: history = [], isLoading: loadingHist } = useWhatsAppMessages({
    contactId: contact?.id,
    companyId: !contact ? company?.id : undefined,
  });

  const canSubmit = useMemo(() => {
    if (!contact && !company) return false;
    if (!remoteJid.trim()) return false;
    if (msgType === 'text') return textContent.trim().length > 0;
    if (msgType === 'audio') return !!audioFile;
    return false;
  }, [contact, company, remoteJid, msgType, textContent, audioFile]);

  const submit = async () => {
    if (!user) return toast.error('Sessão expirada');
    try {
      let media_url: string | null = null;
      let media_mimetype: string | null = null;
      if (msgType === 'audio' && audioFile) {
        setUploading(true);
        media_url = await uploadWhatsAppAudio(audioFile, user.id);
        media_mimetype = audioFile.type || 'audio/ogg';
        setUploading(false);
      }
      const payload: WhatsAppImportInput = {
        contact_id: contact?.id ?? null,
        company_id: company?.id ?? null,
        instance_name: instance || 'manual',
        remote_jid: remoteJid.trim(),
        from_me: fromMe,
        message_type: msgType,
        content: msgType === 'text' ? textContent.trim() : null,
        media_url,
        media_mimetype,
        sender_name: senderName.trim() || null,
        duration_seconds: duration ? Number(duration) : null,
        transcription: transcription.trim() || null,
        transcription_provider: transcription.trim() ? 'manual' : null,
      };
      const res = await importMut.mutateAsync([payload]);
      if (res.inserted_count > 0) {
        setTextContent(''); setAudioFile(null); setTranscription(''); setDuration('');
      }
    } catch (e) {
      toast.error(`Erro: ${parseApiError(e)}`);
      setUploading(false);
    }
  };

  return (
    <main className="container max-w-5xl py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Importar mensagens de WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Salve mensagens de texto e áudio (com transcrição opcional) vinculadas à pessoa e/ou à empresa.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nova mensagem</CardTitle>
            <CardDescription>Preencha os vínculos e o conteúdo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <EntityPicker label="Pessoa" entityType="contact" value={contact} onChange={setContact} />
              <EntityPicker label="Empresa" entityType="company" value={company} onChange={setCompany} />
              <div className="space-y-1.5">
                <Label>Número / JID *</Label>
                <Input value={remoteJid} onChange={(e) => setRemoteJid(e.target.value)} placeholder="5511999999999@s.whatsapp.net" maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label>Nome do remetente</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label>Instância</Label>
                <Input value={instance} onChange={(e) => setInstance(e.target.value)} maxLength={100} />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch id="fromMe" checked={fromMe} onCheckedChange={setFromMe} />
                <Label htmlFor="fromMe">Enviada por mim</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Tabs value={msgType} onValueChange={(v) => setMsgType(v as WhatsAppMessageType)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="text" className="gap-2"><MessageSquare className="h-4 w-4" />Texto</TabsTrigger>
                  <TabsTrigger value="audio" className="gap-2"><Mic className="h-4 w-4" />Áudio</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-4">
                  <div className="space-y-1.5">
                    <Label>Conteúdo *</Label>
                    <Textarea rows={5} value={textContent} onChange={(e) => setTextContent(e.target.value)} maxLength={20000} />
                  </div>
                </TabsContent>
                <TabsContent value="audio" className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label>Arquivo de áudio *</Label>
                    <Input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
                    {audioFile && <p className="text-xs text-muted-foreground">{audioFile.name} — {(audioFile.size / 1024).toFixed(0)} KB</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duração (segundos)</Label>
                    <Input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transcrição (opcional)</Label>
                    <Textarea rows={4} value={transcription} onChange={(e) => setTranscription(e.target.value)} maxLength={20000} placeholder="Cole aqui a transcrição do áudio, se houver." />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end">
              <Button onClick={submit} disabled={!canSubmit || importMut.isPending || uploading}>
                {(importMut.isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Importar mensagem
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              Mensagens vinculadas à {contact ? 'pessoa selecionada' : company ? 'empresa selecionada' : 'entidade'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!contact && !company && (
              <p className="text-sm text-muted-foreground">Selecione uma pessoa ou empresa para ver o histórico.</p>
            )}
            {loadingHist && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!loadingHist && (contact || company) && history.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem encontrada.</p>
            )}
            <ul className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {history.map((m) => {
                const tr = m.whatsapp_transcriptions?.[0]?.content;
                return (
                  <li key={m.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={m.from_me ? 'default' : 'secondary'}>{m.from_me ? 'Enviada' : 'Recebida'}</Badge>
                      <Badge variant="outline" className="gap-1">
                        {m.message_type === 'audio' ? <Mic className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                        {m.message_type}
                      </Badge>
                      <span>{new Date(m.timestamp).toLocaleString('pt-BR')}</span>
                      {m.sender_name && <span>· {m.sender_name}</span>}
                    </div>
                    {m.content && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                    {m.message_type === 'audio' && m.media_url && (
                      <audio controls src={m.media_url} className="w-full" preload="none" />
                    )}
                    {tr && (
                      <div className="text-sm bg-muted/50 rounded p-2 flex gap-2">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <span className="whitespace-pre-wrap">{tr}</span>
                      </div>
                    )}
                    {m.transcription_status === 'pending' && (
                      <Badge variant="outline">Transcrição pendente</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}