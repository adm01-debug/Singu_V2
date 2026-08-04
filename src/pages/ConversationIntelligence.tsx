import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Mic, AlertTriangle, MessageSquare, Settings, TrendingUp } from "lucide-react";
import { useCoachingMetrics, useConversationAnalyses } from "@/hooks/useConversationIntel";
import { ConversationAnalysesTable } from "@/components/conversation-intel/ConversationAnalysesTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ConversationIntelligence() {
  const nav = useNavigate();
  const [days, setDays] = useState(30);
  const { data: metrics, isLoading: loadingMetrics } = useCoachingMetrics(days);
  const { data: analyses, isLoading: loadingAnalyses } = useConversationAnalyses({ days });

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" /> Conversation Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">Análise IA profunda de calls e reuniões com coaching automático.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => nav("/conversation-intelligence/setup")} className="gap-1">
              <Settings className="h-4 w-4" /> Setup
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={<MessageSquare className="h-4 w-4 text-primary" />} label="Conversas analisadas" value={metrics?.total ?? 0} loading={loadingMetrics} />
          <KpiCard icon={<TrendingUp className="h-4 w-4 text-success" />} label="Coaching Score médio" value={`${metrics?.avgScore ?? 0}/100`} loading={loadingMetrics} />
          <KpiCard icon={<Mic className="h-4 w-4 text-accent" />} label="Talk Ratio Vendedor" value={`${metrics?.avgTalk ?? 0}%`} loading={loadingMetrics} />
          <KpiCard icon={<AlertTriangle className="h-4 w-4 text-warning" />} label="Objeções não tratadas" value={metrics?.unhandled ?? 0} loading={loadingMetrics} />
        </div>

        <Tabs defaultValue="conversations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="conversations">Conversas</TabsTrigger>
            <TabsTrigger value="topics">Tópicos</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            <Card>
              <CardHeader><CardTitle className="text-base">Conversas analisadas</CardTitle></CardHeader>
              <CardContent>
                {loadingAnalyses ? <Skeleton className="h-64 w-full" /> :
                  <ConversationAnalysesTable rows={(analyses ?? []) as unknown as Parameters<typeof ConversationAnalysesTable>[0]["rows"]} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Top tópicos detectados</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={metrics?.topTopics ?? []} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Top objeções recorrentes</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={metrics?.topObjections ?? []} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
                        <Bar dataKey="count" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]}>
                          {(metrics?.topObjections ?? []).map((_, i) => <Cell key={i} fill="hsl(var(--warning))" />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coaching">
            <Card>
              <CardHeader><CardTitle className="text-base">Tendência de Coaching Score</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer>
                    <LineChart data={metrics?.trend ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function KpiCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: React.ReactNode; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        {loading ? <Skeleton className="h-7 w-16 mt-2" /> : <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>}
      </CardContent>
    </Card>
  );
}
