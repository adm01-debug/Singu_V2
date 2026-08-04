import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AccessibleChart } from '@/components/ui/accessible-chart';
import type { DailyUptimePoint } from '@/hooks/useErrorBudget';

interface UptimeSparklineProps {
  data: DailyUptimePoint[];
  sloTarget: number;
}

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
};

export function UptimeSparkline({ data, sloTarget }: UptimeSparklineProps) {
  const min = Math.min(sloTarget - 0.5, ...data.map((d) => d.uptime_pct));
  const yMin = Math.max(0, Math.floor(min - 0.5));

  return (
    <AccessibleChart
      summary={`Uptime diário dos últimos 30 dias. Meta SLO: ${sloTarget}%.`}
      data={data.map((d) => ({ label: formatDate(d.date), value: `${d.uptime_pct.toFixed(2)}%` }))}
      columns={['Dia', 'Uptime']}
    >
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="uptimeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={[yMin, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(label) => formatDate(label as string)}
              formatter={(value: number) => [`${value.toFixed(3)}%`, 'Uptime']}
            />
            <ReferenceLine
              y={sloTarget}
              stroke="hsl(var(--warning))"
              strokeDasharray="4 4"
              label={{
                value: `SLO ${sloTarget}%`,
                position: 'insideTopRight',
                fill: 'hsl(var(--warning))',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="uptime_pct"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#uptimeFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AccessibleChart>
  );
}
