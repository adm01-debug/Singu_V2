// ==============================================
// CARNEGIE DASHBOARD
// Unified view of all Carnegie principles
// ==============================================

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star,
  Thermometer,
  Target,
  Award,
  MessageSquare,
  Shield,
  Heart,
  Trophy,
  Gift,
  LayoutDashboard
} from 'lucide-react';
import { Contact } from '@/types';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { CarnegieScorePanel } from './CarnegieScorePanel';
import { WarmthAnalyzerPanel } from './WarmthAnalyzerPanel';
import { NobleCausePanel } from './NobleCausePanel';
import { IdentityLabelingPanel } from './IdentityLabelingPanel';
import { TalkRatioPanel } from './TalkRatioPanel';
import { FaceSavingPanel } from './FaceSavingPanel';
import { VulnerabilityPanel } from './VulnerabilityPanel';
import { ProgressCelebrationPanel } from './ProgressCelebrationPanel';
import { AppreciationPanel } from './AppreciationPanel';
import { cn } from '@/lib/utils';

interface CarnegieDashboardProps {
  contact?: Contact | null;
  className?: string;
}

export function CarnegieDashboard({ contact = null, className }: CarnegieDashboardProps) {
  const { calculateCarnegieScore } = useCarnegieAnalysis(contact);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate a sample score for demo
  const sampleScore = calculateCarnegieScore(65);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-warning/20">
          <Star className="h-6 w-6 text-warning" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Princípios de Carnegie</h2>
          <p className="text-muted-foreground">
            Como Fazer Amigos e Influenciar Pessoas - Implementação Completa
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 h-auto gap-1">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-2 px-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="warmth" className="flex flex-col items-center gap-1 py-2 px-1">
            <Thermometer className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Calor</span>
          </TabsTrigger>
          <TabsTrigger value="noble" className="flex flex-col items-center gap-1 py-2 px-1">
            <Target className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Causa Nobre</span>
          </TabsTrigger>
          <TabsTrigger value="identity" className="flex flex-col items-center gap-1 py-2 px-1">
            <Award className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Identidade</span>
          </TabsTrigger>
          <TabsTrigger value="talk" className="flex flex-col items-center gap-1 py-2 px-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Fala/Escuta</span>
          </TabsTrigger>
          <TabsTrigger value="face" className="flex flex-col items-center gap-1 py-2 px-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Salvar Face</span>
          </TabsTrigger>
          <TabsTrigger value="vulnerability" className="flex flex-col items-center gap-1 py-2 px-1">
            <Heart className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Vulnerabilidade</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex flex-col items-center gap-1 py-2 px-1">
            <Trophy className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Celebrar</span>
          </TabsTrigger>
          <TabsTrigger value="appreciation" className="flex flex-col items-center gap-1 py-2 px-1">
            <Gift className="h-4 w-4" />
            <span className="text-xs hidden sm:block">Apreciação</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CarnegieScorePanel score={sampleScore} />
            <div className="space-y-6">
              <WarmthAnalyzerPanel contact={contact} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="warmth" className="mt-6">
          <WarmthAnalyzerPanel contact={contact} />
        </TabsContent>

        <TabsContent value="noble" className="mt-6">
          <NobleCausePanel contact={contact} />
        </TabsContent>

        <TabsContent value="identity" className="mt-6">
          <IdentityLabelingPanel contact={contact} />
        </TabsContent>

        <TabsContent value="talk" className="mt-6">
          <TalkRatioPanel contact={contact} />
        </TabsContent>

        <TabsContent value="face" className="mt-6">
          <FaceSavingPanel contact={contact} />
        </TabsContent>

        <TabsContent value="vulnerability" className="mt-6">
          <VulnerabilityPanel contact={contact} />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressCelebrationPanel contact={contact} />
        </TabsContent>

        <TabsContent value="appreciation" className="mt-6">
          <AppreciationPanel contact={contact} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
