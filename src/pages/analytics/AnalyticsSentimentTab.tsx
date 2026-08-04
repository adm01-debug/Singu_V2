import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CustomTooltip, PieTooltip, ComparisonBadge } from '@/components/analytics/AnalyticsShared';
import { calcChange } from '@/data/analyticsData';

interface SentimentItem {
  name: string;
  value: number;
  prevValue: number;
}

interface AnalyticsSentimentTabProps {
  sentimentData: SentimentItem[];
  sentimentColors: Record<string, string>;
  relationshipData: { date: string; score: number }[];
}

export function AnalyticsSentimentTab({ sentimentData, sentimentColors, relationshipData }: AnalyticsSentimentTabProps) {
  const total = sentimentData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-accent" />Distribuição de Sentimentos</CardTitle>
            <CardDescription>Proporção de interações por tipo de sentimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={sentimentColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {sentimentData.map((item) => {
                const comparison = calcChange(item.value, item.prevValue);
                return (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sentimentColors[item.name] }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <ComparisonBadge comparison={comparison} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-success" />Evolução do Sentimento</CardTitle>
            <CardDescription>Tendência de sentimentos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={relationshipData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Score de Relacionamento" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-warning" />Insights de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, label: 'Positivo', colorBg: 'bg-success/10 border-emerald-500/20', colorText: 'text-success', index: 0 },
                { icon: Minus, label: 'Neutro', colorBg: 'bg-muted/50 border-border', colorText: 'text-muted-foreground', index: 1 },
                { icon: TrendingDown, label: 'Negativo', colorBg: 'bg-destructive/10 border-destructive/20', colorText: 'text-destructive', index: 2 },
              ].map(({ icon: Icon, label, colorBg, colorText, index }) => (
                <div key={label} className={`p-4 rounded-lg border ${colorBg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${colorText}`} /><span className={`font-medium ${colorText}`}>{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">{sentimentData[index]?.value}</p>
                  <p className="text-sm text-muted-foreground">{total > 0 ? Math.round((sentimentData[index]?.value / total) * 100) : 0}% do total</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
