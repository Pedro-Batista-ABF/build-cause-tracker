
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PPCChartProps {
  data: Array<{
    week: string;
    ppc: number;
  }>;
  isLoading?: boolean;
}

export function PPCChart({ data, isLoading = false }: PPCChartProps) {
  return (
    <Card className="md:col-span-2 bg-card-bg border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-primary">Tendência de PPC</CardTitle>
        <CardDescription className="text-text-secondary">
          Evolução semanal do PPC no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <div className="h-full w-full bg-border-subtle/20 flex items-center justify-center rounded">
              <p className="text-text-secondary">Carregando dados...</p>
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ppcColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D5EF1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D5EF1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242A3D" />
                <XAxis dataKey="week" stroke="#A9B0C5" />
                <YAxis stroke="#A9B0C5" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1A1E2C",
                    borderColor: "#242A3D",
                    color: "#FFFFFF"
                  }}
                  formatter={(value: number) => [`${value}%`, 'PPC']}
                />
                <Area 
                  type="monotone" 
                  dataKey="ppc" 
                  stroke="#1D5EF1" 
                  fillOpacity={1}
                  fill="url(#ppcColor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-text-secondary">Nenhum dado disponível para o período selecionado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
