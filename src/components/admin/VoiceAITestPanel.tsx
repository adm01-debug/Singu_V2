import { useState, useCallback, useRef } from 'react';
import { Mic, MicOff, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TestResult {
  sttText: string | null;
  nluAction: Record<string, unknown> | null;
  ttsPlayed: boolean;
  latencies: {
    stt_ms: number;
    nlu_ms: number;
    tts_ms: number;
    total_ms: number;
  };
}

type TestPhase = 'idle' | 'recording' | 'transcribing' | 'processing' | 'speaking' | 'done' | 'error';

const PHASE_LABELS: Record<TestPhase, string> = {
  idle: 'Pronto para testar',
  recording: 'Gravando áudio (5s)...',
  transcribing: 'Transcrevendo (STT)...',
  processing: 'Processando intenção (NLU)...',
  speaking: 'Reproduzindo resposta (TTS)...',
  done: 'Teste completo!',
  error: 'Erro no teste',
};

export function VoiceAITestPanel() {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const runTest = useCallback(async () => {
    setPhase('recording');
    setError(null);
    setResult(null);
    setPartialTranscript('');

    const latencies = { stt_ms: 0, nlu_ms: 0, tts_ms: 0, total_ms: 0 };
    const totalStart = Date.now();

    try {
      // 1. Record 5s audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const audioBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {

          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: 'audio/webm' }));
        };
        recorder.start();
        setTimeout(() => recorder.stop(), 5000);
      });

      // 2. STT via voice-to-text
      setPhase('transcribing');
      const sttStart = Date.now();

      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1] || '');
        };
        reader.readAsDataURL(audioBlob);
      });

      const { data: sttData, error: sttError } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio, mimeType: 'audio/webm' },
      });

      latencies.stt_ms = Date.now() - sttStart;

      if (sttError) throw new Error(`STT: ${sttError.message}`);

      const transcript = sttData?.text || sttData?.transcript || '';
      setPartialTranscript(transcript);

      if (!transcript) {
        setPhase('done');
        setResult({ sttText: '(sem fala detectada)', nluAction: null, ttsPlayed: false, latencies: { ...latencies, total_ms: Date.now() - totalStart } });
        return;
      }

      // 3. NLU via voice-agent
      setPhase('processing');
      const nluStart = Date.now();
      const { data: nluData, error: nluError } = await supabase.functions.invoke('voice-agent', {
        body: { transcript },
      });
      latencies.nlu_ms = Date.now() - nluStart;

      if (nluError) throw new Error(`NLU: ${nluError.message}`);

      // 4. TTS via elevenlabs-tts
      setPhase('speaking');
      const ttsStart = Date.now();
      const responseText = nluData?.response || 'Teste concluído com sucesso.';
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text: responseText },
      });
      latencies.tts_ms = Date.now() - ttsStart;

      let ttsPlayed = false;
      if (!ttsError && ttsData) {
        try {
          const audioContent = ttsData.audioContent || ttsData.audio;
          if (audioContent) {
            const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
            await audio.play();
            ttsPlayed = true;
          }
        } catch {
          // TTS playback optional
        }
      }

      latencies.total_ms = Date.now() - totalStart;
      setResult({ sttText: transcript, nluAction: nluData, ttsPlayed, latencies });
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPhase('error');
      latencies.total_ms = Date.now() - totalStart;
      setResult((prev) => prev ? { ...prev, latencies } : null);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const isActive = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Painel de Teste de Voz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase indicator */}
        <div className={cn(
          'px-3 py-2 rounded text-sm font-medium',
          phase === 'done' && 'bg-success/10 text-success',
          phase === 'error' && 'bg-destructive/10 text-destructive',
          isActive && 'bg-primary/10 text-primary',
          phase === 'idle' && 'bg-muted text-muted-foreground',
        )}>
          {isActive && <Loader2 className="h-3 w-3 inline mr-2 animate-spin" />}
          {PHASE_LABELS[phase]}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={runTest} disabled={isActive} size="sm">
            <Mic className="h-4 w-4 mr-1" />
            Gravar Teste (5s)
          </Button>
          {phase === 'recording' && (
            <Button onClick={stopRecording} variant="destructive" size="sm">
              <MicOff className="h-4 w-4 mr-1" />
              Parar
            </Button>
          )}
        </div>

        {/* Partial transcript */}
        {partialTranscript && (
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Transcrição STT:</p>
            <p className="font-medium">{partialTranscript}</p>
          </div>
        )}

        {/* NLU Result */}
        {result?.nluAction && (
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Intent NLU:</p>
            <pre className="text-xs bg-muted/30 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.nluAction, null, 2)}
            </pre>
          </div>
        )}

        {/* Latency timeline */}
        {result?.latencies && (
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Latências
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(['stt_ms', 'nlu_ms', 'tts_ms', 'total_ms'] as const).map((key) => (
                <div key={key} className="bg-muted/20 p-2 rounded">
                  <p className="text-xs text-muted-foreground">{key.replace('_ms', '').toUpperCase()}</p>
                  <p className="font-bold">{result.latencies[key]}ms</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
