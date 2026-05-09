import { Users, Heart, Star, Baby, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  hobbies?: string[];
  interests?: string[];
  familyInfo?: string;
  className?: string;
}

export function ContactFamilyInterestsCard({ hobbies, interests, familyInfo, className }: Props) {
  const hasHobbies = hobbies && hobbies.length > 0;
  const hasInterests = interests && interests.length > 0;
  const hasFamily = !!familyInfo;

  if (!hasHobbies && !hasInterests && !hasFamily) {
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
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Use estas informações para criar conexão e empatia (rapport).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {hasFamily && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3 w-3 text-blue-500" />
              Família & Contexto
            </h4>
            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 text-xs leading-relaxed">
              {familyInfo}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hasHobbies && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3 w-3 text-amber-500" />
                Hobbies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {hobbies.map((hobby, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/50"
                  >
                    {hobby}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasInterests && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-purple-500" />
                Interesses
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((interest, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200/50"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
