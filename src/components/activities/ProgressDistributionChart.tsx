
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateDistribution, DistributionType } from "@/utils/progressDistribution";

interface ProgressDistributionChartProps {
  startDate: string;
  endDate: string;
  totalQuantity: number;
  distributionType: DistributionType;
  unit: string;
}

export function ProgressDistributionChart({ 
  startDate, 
  endDate, 
  totalQuantity,
  distributionType,
  unit
}: ProgressDistributionChartProps) {
  const distributionData = calculateDistribution(startDate, endDate, totalQuantity, distributionType);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Distribuição do Avanço Planejado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.split('-').reverse().slice(0, 2).join('/')}
              />
              <YAxis unit={` ${unit}`} />
              <Tooltip 
                formatter={(value: number) => [`${value} ${unit}`, '']}
                labelFormatter={(label) => label.split('-').reverse().join('/')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="planned" 
                name="Planejado" 
                stroke="#8884d8" 
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                name="Acumulado" 
                stroke="#82ca9d" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
