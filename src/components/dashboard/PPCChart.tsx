import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export interface PPCChartProps {
  data: Array<{
    week: string;
    ppc: number;
  }>;
  isLoading: boolean;
  className?: string;
}

export function PPCChart({ data, isLoading, className }: PPCChartProps) {
  return (
    <Card className={`bg-card-bg border-border-subtle ${className}`}>
      <CardHeader>
        <CardTitle className="text-text-primary">PPC Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-text-secondary">Carregando gráfico...</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="ppc" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-text-secondary">Nenhum dado disponível para o período selecionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
