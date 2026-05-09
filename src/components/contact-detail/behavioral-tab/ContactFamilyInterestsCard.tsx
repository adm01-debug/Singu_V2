import { useState } from 'react';
import { Users, Heart, Star, Info, Pencil, Check, X, Loader2, Sparkles, MessageSquare, Phone, Linkedin, Instagram, Twitter, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FamilyHistoryDialog } from './FamilyHistoryDialog';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
  hobbies?: string[];
  interests?: string[];
  familyInfo?: string;
  metadata?: any;
  onUpdate?: (data: { family_info?: string; hobbies?: string[]; interests?: string[] }) => Promise<any>;
  className?: string;
}

export function ContactFamilyInterestsCard({ contactId, hobbies, interests, familyInfo, metadata, onUpdate, className }: Props) {
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [familyValue, setFamilyValue] = useState(familyInfo || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveFamily = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({ family_info: familyValue });
      setIsEditingFamily(false);
    } finally {
      setIsSaving(false);
    }
  };
  const hasHobbies = hobbies && hobbies.length > 0;
  const hasInterests = interests && interests.length > 0;
  const hasFamily = !!familyInfo;

  if (!hasHobbies && !hasInterests && !hasFamily && !onUpdate) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden border-primary/10 shadow-sm", className)}>
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Heart className="h-4 w-4 text-primary" />
          Vida Pessoal & Rapport
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Use estas informações para criar conexão e empatia (rapport). Hobbies e interesses podem ser sugeridos via Lux Intelligence.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3 w-3 text-blue-500" />
              Família & Contexto
            </h4>
            {!isEditingFamily && onUpdate && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                onClick={() => setIsEditingFamily(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {isEditingFamily ? (
            <div className="space-y-2">
              <Textarea 
                value={familyValue}
                onChange={(e) => setFamilyValue(e.target.value)}
                placeholder="Ex: Casado com Maria, 2 filhos (Pedro e Ana)..."
                className="text-xs min-h-[80px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2 text-[10px]"
                  onClick={() => {
                    setIsEditingFamily(false);
                    setFamilyValue(familyInfo || '');
                  }}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3 mr-1" /> Cancelar
                </Button>
                <Button 
                  size="sm" 
                  className="h-7 px-2 text-[10px]"
                  onClick={handleSaveFamily}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <><Check className="h-3 w-3 mr-1" /> Salvar</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 text-xs leading-relaxed transition-colors",
                onUpdate && "cursor-pointer hover:bg-blue-100/30"
              )}
              onClick={() => onUpdate && setIsEditingFamily(true)}
            >
              {familyInfo || <span className="text-muted-foreground italic">Nenhuma informação familiar registrada. Clique para adicionar.</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-500" />
              Hobbies
            </h4>
            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
              {hobbies && hobbies.length > 0 ? hobbies.map((hobby, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/50"
                >
                  {hobby}
                </Badge>
              )) : (
                <span className="text-[10px] text-muted-foreground italic">Nenhum registrado</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-purple-500" />
              Interesses
            </h4>
            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
              {interests && interests.length > 0 ? interests.map((interest, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200/50"
                >
                  {interest}
                </Badge>
              )) : (
                <span className="text-[10px] text-muted-foreground italic">Nenhum registrado</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper icons needed by the component
function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}
