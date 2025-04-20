
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ActivityProgressChartProps {
  data: {
    date: string;
    actual: number;
    planned: number;
  }[];
  unit: string;
}

export function ActivityProgressChart({ data, unit }: ActivityProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Progresso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              />
              <YAxis unit={` ${unit}`} />
              <Tooltip 
                formatter={(value: number) => [`${value} ${unit}`, '']}
                labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
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
                dataKey="actual" 
                name="Realizado" 
                stroke="#82ca9d" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
