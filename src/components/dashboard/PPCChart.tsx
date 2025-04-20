
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';

export interface PPCChartProps {
  data: Array<{
    week: string;
    ppc: number;
  }>;
  isLoading: boolean;
  className?: string;
}

export function PPCChart({ data, isLoading, className }: PPCChartProps) {
  // Calcular média de PPC para exibir uma linha de referência
  const avgPPC = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.ppc, 0) / data.length) 
    : 0;

  // Personalizar o tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-emerald-600">{`PPC: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

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
            <LineChart 
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis 
                dataKey="week" 
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine 
                y={90} 
                label={{ value: 'Meta: 90%', position: 'top', fill: '#666' }} 
                stroke="#ff7300"
                strokeDasharray="3 3"
              />
              {avgPPC > 0 && (
                <ReferenceLine 
                  y={avgPPC} 
                  label={{ value: `Média: ${avgPPC}%`, position: 'bottom', fill: '#666' }} 
                  stroke="#82ca9d"
                  strokeDasharray="3 3"
                />
              )}
              <Line 
                type="monotone" 
                dataKey="ppc" 
                name="PPC"
                stroke="#4CAF50" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, stroke: '#4CAF50', strokeWidth: 2 }}
              />
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
