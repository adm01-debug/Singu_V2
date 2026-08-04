import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { BarChart3, Activity, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CustomTooltip } from '@/components/analytics/AnalyticsShared';

interface AnalyticsEngagementTabProps {
  channelData: { channel: string; sent: number; received: number }[];
  radarData: { metric: string; value: number }[];
  relationshipData: { date: string; interactions: number }[];
}

export function AnalyticsEngagementTab({ channelData, radarData, relationshipData }: AnalyticsEngagementTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Engajamento por Canal</CardTitle>
            <CardDescription>Mensagens enviadas vs recebidas por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="channel" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sent" name="Enviadas" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="received" name="Recebidas" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Métricas de Engajamento</CardTitle>
            <CardDescription>Análise multidimensional do seu desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Atual" dataKey="value" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Volume de Interações</CardTitle>
            <CardDescription>Número de interações ao longo do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={relationshipData}>
                  <defs>
                    <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(280, 67%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(280, 67%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="interactions" name="Interações" stroke="hsl(280, 67%, 45%)" fill="url(#colorInteractions)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
