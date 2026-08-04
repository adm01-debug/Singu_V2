import type { ReactNode } from 'react';

interface ChartDataRow {
  label: string;
  value: string | number;
}

interface AccessibleChartProps {
  /** Visible chart element */
  children: ReactNode;
  /** Description for screen readers */
  summary: string;
  /** Data rows for sr-only table */
  data: ChartDataRow[];
  /** Column headers */
  columns?: [string, string];
}

/**
 * Wraps a Recharts chart with an sr-only data table for screen reader accessibility.
 * WCAG 2.1 §1.1.1 — Non-text Content
 */
export function AccessibleChart({
  children,
  summary,
  data,
  columns = ['Período', 'Valor'],
}: AccessibleChartProps) {
  return (
    <div role="figure" aria-label={summary}>
      {/* Visual chart — hidden from screen readers */}
      <div aria-hidden="true">{children}</div>

      {/* Data table — visible only to screen readers */}
      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">{columns[0]}</th>
            <th scope="col">{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.label}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
