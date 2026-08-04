import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { EMOTIONAL_STATE_INFO } from '@/data/nlpAdvancedData';
import { EmotionalState } from '@/types/nlp-advanced';

interface VAKDataPoint {
  date: string;
  displayDate: string;
  visual: number;
  auditory: number;
  kinesthetic: number;
  digital: number;
}

interface EmotionalDataPoint {
  date: string;
  displayDate: string;
  state: EmotionalState;
  confidence: number;
  stateScore: number;
}

interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

interface NLPEvolutionChartsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  vakData: VAKDataPoint[];
  emotionalData: EmotionalDataPoint[];
  radarData: RadarDataPoint[];
}

const VAK_COLORS = {
  visual: '#06b6d4',
  auditory: '#3b82f6',
  kinesthetic: '#22c55e',
  digital: '#64748b'
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))'
};

export function NLPEvolutionCharts({ activeTab, onTabChange, vakData, emotionalData, radarData }: NLPEvolutionChartsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">Visão Geral</TabsTrigger>
        <TabsTrigger value="vak">VAK</TabsTrigger>
        <TabsTrigger value="emotional">Emocional</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <div className="grid md:grid-cols-2 gap-4">
          {radarData.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Perfil VAK Atual</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Perfil" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {emotionalData.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Tendência Emocional</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={emotionalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value > 0 ? 'Positivo' : value < 0 ? 'Negativo' : 'Neutro', 'Estado']} />
                    <Area type="monotone" dataKey="stateScore" stroke="#22c55e" fill="url(#emotionalGradient)" />
                    <defs>
                      <linearGradient id="emotionalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="vak" className="mt-4">
        {vakData.length > 0 ? (
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Evolução dos Sistemas VAK</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="visual" name="Visual" stackId="1" stroke={VAK_COLORS.visual} fill={VAK_COLORS.visual} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="auditory" name="Auditivo" stackId="1" stroke={VAK_COLORS.auditory} fill={VAK_COLORS.auditory} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="kinesthetic" name="Cinestésico" stackId="1" stroke={VAK_COLORS.kinesthetic} fill={VAK_COLORS.kinesthetic} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="digital" name="Digital" stackId="1" stroke={VAK_COLORS.digital} fill={VAK_COLORS.digital} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Sem dados VAK suficientes para o período</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="emotional" className="mt-4">
        {emotionalData.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Histórico Emocional</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emotionalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Confiança', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Confiança']} />
                    <Line type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Últimos Estados Detectados</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {emotionalData.slice(-5).reverse().map((entry, idx) => {
                  const info = EMOTIONAL_STATE_INFO[entry.state];
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{info?.icon || '😐'}</span>
                        <span>{info?.name || entry.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{entry.confidence}%</span>
                        <span>{entry.displayDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Sem dados emocionais suficientes para o período</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
