import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useYoyComparison } from '@/hooks/useReportsAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar } from 'lucide-react';

export const YoyComparisonWidget = React.memo(function YoyComparisonWidget() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: yoyData, isLoading } = useYoyComparison(year);

  if (isLoading) return <Skeleton className="h-72 rounded-lg" />;
  if (!yoyData || yoyData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Comparação Ano a Ano
          </CardTitle>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={yoyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="current_year" name={`${year}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="previous_year" name={`${year - 1}`} fill="hsl(var(--muted-foreground)/0.4)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export default YoyComparisonWidget;
