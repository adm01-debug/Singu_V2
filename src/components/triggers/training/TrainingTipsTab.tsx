import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Eye, ThumbsUp, ThumbsDown,
  CheckCircle2, AlertTriangle, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { SalespersonProfile, TrainingTip } from '@/data/communicationTrainingData';

interface TrainingTipsTabProps {
  salespersonProfile: SalespersonProfile | null;
  getDISCTip: (disc: DISCProfile) => TrainingTip;
  getVAKTip: (vak: VAKType) => TrainingTip;
}

export function TrainingTipsTab({ salespersonProfile, getDISCTip, getVAKTip }: TrainingTipsTabProps) {
  const [selectedDISC, setSelectedDISC] = useState<DISCProfile>('D');
  const [selectedVAK, setSelectedVAK] = useState<VAKType>('V');

  const discTip = getDISCTip(selectedDISC);
  const vakTip = getVAKTip(selectedVAK);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* DISC Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-info" />
            Perfil DISC do Cliente
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((disc) => (
              <Button
                key={disc}
                variant={selectedDISC === disc ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDISC(disc)}
                className={cn(
                  'flex-col h-auto py-2',
                  disc === salespersonProfile?.discProfile && 'opacity-50'
                )}
              >
                <span className="font-bold">{disc}</span>
                <span className="text-xs truncate">{DISC_LABELS[disc].name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* VAK Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4 text-secondary" />
            Sistema VAK do Cliente
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {(['V', 'A', 'K', 'D'] as VAKType[]).map((vak) => (
              <Button
                key={vak}
                variant={selectedVAK === vak ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVAK(vak)}
                className={cn(
                  'flex-col h-auto py-2',
                  vak === salespersonProfile?.vakProfile && 'opacity-50'
                )}
              >
                <span>{VAK_LABELS[vak].icon}</span>
                <span className="text-xs">{VAK_LABELS[vak].name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* DISC Tips */}
      {discTip && (
        <TipCard
          key={`disc-${selectedDISC}`}
          tip={discTip}
          icon={<Target className="w-4 h-4 text-info" />}
          bgClass="bg-muted/30"
        />
      )}

      {/* VAK Tips */}
      {vakTip && (
        <TipCard
          key={`vak-${selectedVAK}`}
          tip={vakTip}
          icon={<Eye className="w-4 h-4 text-secondary" />}
          bgClass="bg-muted/30"
        />
      )}
    </div>
  );
}

function TipCard({ tip, icon, bgClass }: { tip: TrainingTip; icon: React.ReactNode; bgClass: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`p-4 rounded-lg border ${bgClass}`}>
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          {icon}
          {tip.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{tip.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-success flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> FAÇA
            </p>
            <ul className="space-y-1">
              {tip.doList.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-success mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-destructive flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" /> NÃO FAÇA
            </p>
            <ul className="space-y-1">
              {tip.dontList.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-background/80 rounded-lg">
          <p className="text-xs font-medium mb-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Exemplos de frases:
          </p>
          <div className="space-y-1">
            {tip.examples.map((ex, i) => (
              <p key={i} className="text-xs italic text-muted-foreground">{ex}</p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
