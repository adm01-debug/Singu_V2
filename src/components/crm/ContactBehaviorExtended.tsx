import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageSquare, ShieldCheck, Users, Briefcase, Activity, Shield, FileText, Compass } from "lucide-react";
import { useContactBehavior } from "@/hooks/useContactBehavior";
import { DISCSubTab } from "./behavior/DISCSubTab";
import { MotivationsSubTab } from "./behavior/MotivationsSubTab";
import { CommunicationSubTab } from "./behavior/CommunicationSubTab";
import { DecisionMakingSubTab } from "./behavior/DecisionMakingSubTab";
import { InfluencePowerSubTab } from "./behavior/InfluencePowerSubTab";
import { BusinessContextSubTab } from "./behavior/BusinessContextSubTab";
import { ConsentAuditLog } from "./consent/ConsentAuditLog";
import { RelationshipReportExport } from "./relationship/RelationshipReportExport";
import { NeuromarketingTimeline } from "./behavior/NeuromarketingTimeline";
import { PredictiveRoadmap } from "./behavior/PredictiveRoadmap";

interface ContactBehaviorExtendedProps {
  contactId: string;
}

export const ContactBehaviorExtended = ({ contactId }: ContactBehaviorExtendedProps) => {
  const { behavior, decision, influence, businessContext, isLoading } = useContactBehavior(contactId);

  if (isLoading) return <div>Carregando perfil comportamental...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="disc" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 mb-8">
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="neuro" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Neuro</span>
          </TabsTrigger>
        <TabsContent value="neuro">
          <NeuromarketingTimeline contactId={contactId} />
        </TabsContent>
        <TabsContent value="roadmap">
          <PredictiveRoadmap contactId={contactId} />
        </TabsContent>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </TabsTrigger>
        <TabsContent value="export">
          <div className="max-w-md mx-auto py-8">
            <RelationshipReportExport contactId={contactId} contactName="Relatório de Contato" />
          </div>
        </TabsContent>
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Consentimento</span>
          </TabsTrigger>
        <TabsContent value="consent">
          <ConsentAuditLog contactId={contactId} />
        </TabsContent>
          <TabsTrigger value="disc" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">DISC & VAK</span>
          </TabsTrigger>
          <TabsTrigger value="motivations" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Motivações</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comunicação</span>
          </TabsTrigger>
          <TabsTrigger value="decision" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Decisão</span>
          </TabsTrigger>
          <TabsTrigger value="influence" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Poder</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Contexto</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disc">
          <DISCSubTab contactId={contactId} data={behavior} />
        </TabsContent>
        <TabsContent value="motivations">
          <MotivationsSubTab contactId={contactId} data={behavior} />
        </TabsContent>
        <TabsContent value="communication">
          <CommunicationSubTab contactId={contactId} data={behavior} />
        </TabsContent>
        <TabsContent value="decision">
          <DecisionMakingSubTab contactId={contactId} data={decision} />
        </TabsContent>
        <TabsContent value="influence">
          <InfluencePowerSubTab contactId={contactId} data={influence} />
        </TabsContent>
        <TabsContent value="business">
          <BusinessContextSubTab contactId={contactId} data={businessContext} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
