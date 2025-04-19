
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaChart, BarChart, Calendar, Clock } from "lucide-react";
import { CartesianGrid, Legend, Bar, BarChart as ReBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const mockWeeklyData = [
  { semana: "Sem 1", previsto: 100, realizado: 95, aderencia: 95 },
  { semana: "Sem 2", previsto: 100, realizado: 88, aderencia: 88 },
  { semana: "Sem 3", previsto: 100, realizado: 92, aderencia: 92 },
  { semana: "Sem 4", previsto: 100, realizado: 85, aderencia: 85 },
];

const mockCausesData = [
  { name: "Mão de obra", valor: 12 },
  { name: "Material", valor: 8 },
  { name: "Equipamento", valor: 7 },
  { name: "Planejamento", valor: 5 },
  { name: "Clima", valor: 3 },
  { name: "Cliente", valor: 3 },
];

export default function Indicators() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
        <Button variant="outline">Últimas 4 semanas</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="PPC Médio"
          value="85%"
          icon={<BarChart className="h-4 w-4" />}
          description="Últimas 4 semanas"
        />
        <DashboardCard
          title="Aderência"
          value="92%"
          icon={<Calendar className="h-4 w-4" />}
          description="Planejado vs. Executado"
        />
        <DashboardCard
          title="Atividades"
          value="54"
          icon={<AreaChart className="h-4 w-4" />}
          description="Em andamento"
        />
        <DashboardCard
          title="Causas"
          value="24"
          icon={<Clock className="h-4 w-4" />}
          description="Registradas no período"
          className="border-l-4 border-l-rust"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PPC Semanal</CardTitle>
            <CardDescription>
              Percentual de atividades completadas por semana
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={mockWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="previsto"
                  name="Previsto"
                  fill="#8E9196"
                  maxBarSize={40}
                />
                <Bar
                  dataKey="realizado"
                  name="Realizado"
                  fill="#4D6A6D"
                  maxBarSize={40}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais Causas</CardTitle>
            <CardDescription>
              Causas mais frequentes de baixo PPC
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={mockCausesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="valor"
                  name="Ocorrências"
                  fill="#A63446"
                  maxBarSize={30}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
