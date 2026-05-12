import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
 import { Smartphone, Mail, MessageSquare, CheckCircle } from 'lucide-react';

interface ChannelPreview {
  channel: string;
  formattedText: string;
  characterCount: number;
  characterLimit?: number;
  isWithinLimit: boolean;
  suggestions: string[];
  preview: { backgroundColor?: string };
}

interface Props {
  analyzeText: string;
  onTextChange: (text: string) => void;
  channelPreviews: ChannelPreview[];
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <Smartphone className="h-4 w-4 text-success" />,
  email: <Mail className="h-4 w-4 text-info" />,
  instagram: <Smartphone className="h-4 w-4 text-primary" />,
  linkedin: <Smartphone className="h-4 w-4 text-info" />,
  sms: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
};

export function CopywritingPreviewTab({ analyzeText, onTextChange, channelPreviews }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Texto para Preview:</label>
        <Textarea
          placeholder="Cole seu texto para ver como fica em cada canal..."
          value={analyzeText}
          onChange={(e) => onTextChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {channelPreviews.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelPreviews.slice(0, 5).map((preview) => (
            <div key={preview.channel} className="bg-background rounded-lg border overflow-hidden">
              <div className="bg-muted px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channelIcons[preview.channel] || <MessageSquare className="h-4 w-4" />}
                  <span className="font-medium capitalize">{preview.channel}</span>
                </div>
                <Badge variant={preview.isWithinLimit ? 'secondary' : 'destructive'} className="text-xs">
                  {preview.characterCount}{preview.characterLimit ? `/${preview.characterLimit}` : ''}
                </Badge>
              </div>

              <div
                className="p-3"
                style={{ backgroundColor: preview.preview.backgroundColor || 'transparent' }}
              >
                 {preview.channel === 'whatsapp' ? (
                   <div className="relative p-4 bg-[#e5ddd5] rounded-md min-h-[120px]">
                     <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] ml-auto shadow-sm relative">
                       <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                         {preview.formattedText}
                       </p>
                       <div className="text-[10px] text-gray-500 text-right mt-1 flex items-center justify-end gap-1">
                         <span>10:45</span>
                         <div className="flex -space-x-1">
                           <CheckCircle className="h-3 w-3 text-blue-500 fill-blue-500" />
                           <CheckCircle className="h-3 w-3 text-blue-500 fill-blue-500" />
                         </div>
                       </div>
                       {/* WhatsApp Tail */}
                       <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-r-[10px] border-r-transparent"></div>
                     </div>
                   </div>
                 ) : preview.channel === 'email' ? (
                   <div className="bg-white border rounded shadow-sm p-4">
                     <div className="border-b pb-2 mb-3 text-xs text-muted-foreground">
                       <div className="flex justify-between mb-1">
                         <span>De: Você</span>
                         <span>Agora</span>
                       </div>
                       <div className="font-bold text-foreground">Assunto: [Script Sugerido]</div>
                     </div>
                     <p className="text-sm whitespace-pre-wrap leading-relaxed">
                       {preview.formattedText}
                     </p>
                   </div>
                 ) : (
                   <div className="bg-muted/20 p-4 rounded border border-dashed">
                     <p className="text-sm whitespace-pre-wrap">
                       {preview.formattedText}
                     </p>
                   </div>
                 )}
              </div>

              {preview.suggestions.length > 0 && (
                <div className="px-3 py-2 bg-warning/10 text-xs">
                  {preview.suggestions.map((s, i) => (
                    <p key={i} className="text-warning">⚠️ {s}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
