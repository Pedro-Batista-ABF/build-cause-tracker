
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, BarChart } from "lucide-react";
import { CartesianGrid, Legend, Bar, BarChart as ReBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const mockWeeklyCauses = [
  { semana: "Sem 1", quantidade: 12 },
  { semana: "Sem 2", quantidade: 8 },
  { semana: "Sem 3", quantidade: 15 },
  { semana: "Sem 4", quantidade: 10 },
];

const mockCausesData = [
  { name: "Mão de obra", quantidade: 12 },
  { name: "Material", quantidade: 8 },
  { name: "Equipamento", quantidade: 7 },
  { name: "Planejamento", quantidade: 5 },
  { name: "Clima", quantidade: 3 },
  { name: "Cliente", quantidade: 3 },
];

export default function Causes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Causas</h1>
        <Button variant="outline">Últimas 4 semanas</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Total de Causas"
          value="38"
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Últimas 4 semanas"
        />
        <DashboardCard
          title="Principal Causa"
          value="Mão de obra"
          icon={<AlertTriangle className="h-4 w-4" />}
          description="12 ocorrências"
        />
        <DashboardCard
          title="Média Semanal"
          value="9.5"
          icon={<BarChart className="h-4 w-4" />}
          description="Causas por semana"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Causas por Semana</CardTitle>
            <CardDescription>
              Número de causas registradas por semana
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={mockWeeklyCauses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="quantidade"
                  name="Quantidade"
                  fill="#A63446"
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
              Distribuição das causas por categoria
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
                  dataKey="quantidade"
                  name="Ocorrências"
                  fill="#4D6A6D"
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
