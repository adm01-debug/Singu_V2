import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TopicsEditor } from "@/components/conversation-intel/TopicsEditor";
import { ScorecardEditor } from "@/components/conversation-intel/ScorecardEditor";

export default function ConversationIntelligenceSetup() {
  const nav = useNavigate();
  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => nav("/conversation-intelligence")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Setup — Conversation Intelligence</h1>
            <p className="text-sm text-muted-foreground">Configure o catálogo de tópicos e os scorecards de coaching.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <TopicsEditor />
          <ScorecardEditor />
        </div>
      </div>
    </AppLayout>
  );
}
