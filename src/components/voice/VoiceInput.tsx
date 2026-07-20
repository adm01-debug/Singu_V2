import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Square, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";

 interface VoiceInputProps {
   onTranscription: (text: string, audioUrl?: string) => void;
   className?: string;
   placeholder?: string;
   disabled?: boolean;
   uploadAudio?: boolean;
 }

 export function VoiceInput({ 
   onTranscription, 
   className,
   placeholder = "Clique para gravar",
   disabled = false,
   uploadAudio = false
 }: VoiceInputProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          await processAudio(audioBlob);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error starting recording:', { error: msg });
      setError('Não foi possível acessar o microfone');
      toast({
        title: 'Erro ao gravar',
        description: 'Verifique as permissões do microfone',
        variant: 'destructive'
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await base64Promise;

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) { throw error; }

       let audioUrl: string | undefined;
       if (uploadAudio) {
         // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
         const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
         const { data: uploadData, error: uploadError } = await supabase.storage
           .from('interaction-audios')
           .upload(`${user?.id}/${fileName}`, audioBlob);
 
         if (uploadError) {
           logger.error('Error uploading audio:', uploadError);
         } else if (uploadData) {
           const { data: urlData } = supabase.storage
             .from('interaction-audios')
             .getPublicUrl(uploadData.path);
           audioUrl = urlData.publicUrl;
         }
       }
 
       if (data?.text) {
         onTranscription(data.text, audioUrl);
         toast({
           title: 'Transcrição concluída',
           description: audioUrl ? 'Áudio salvo e convertido em texto' : 'Áudio convertido em texto'
         });
       } else {
         throw new Error('Nenhum texto reconhecido');
       }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error processing audio:', { error: msg });
      setError('Erro ao processar áudio');
      toast({
        title: 'Erro na transcrição',
        description: 'Não foi possível converter o áudio em texto',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          "relative transition-all duration-300",
          isRecording && "animate-pulse"
        )}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Square className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Mic className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {isRecording && (
          <motion.span
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"
          />
        )}
      </Button>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-destructive font-medium">
              {formatTime(recordingTime)}
            </span>
            <span className="text-muted-foreground">Gravando...</span>
          </motion.div>
        )}
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-sm text-muted-foreground"
          >
            Processando áudio...
          </motion.div>
        )}
        
        {error && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1 text-sm text-destructive"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.div>
        )}
        
        {!isRecording && !isProcessing && !error && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            {placeholder}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
