
import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart2, Calendar, Clock, FileText, Plus, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const mockProjects = [
  {
    id: "1",
    name: "Projeto ALUMAR",
    client: "Empresa A",
    contract: "CT-2023-001",
    startDate: "2023-01-15",
    endDate: "2023-12-31",
    status: "active" as const,
    ppc: 95,
  },
  {
    id: "2",
    name: "Expansão Setor 4",
    client: "Empresa B",
    contract: "CT-2023-002",
    startDate: "2023-02-10",
    endDate: "2023-11-30",
    status: "delayed" as const,
    ppc: 68,
  },
  {
    id: "3",
    name: "Modernização Unidade Sul",
    client: "Empresa C",
    contract: "CT-2023-003",
    startDate: "2023-03-01",
    endDate: "2023-09-30",
    status: "inactive" as const,
    ppc: 0,
  },
];

const mockCauses = [
  { cause: "Mão de obra", count: 12, category: "Método" },
  { cause: "Material", count: 8, category: "Material" },
  { cause: "Equipamento", count: 7, category: "Máquina" },
  { cause: "Planejamento", count: 5, category: "Método" },
];

const chartData = [
  { week: "Semana 1", ppc: 85 },
  { week: "Semana 2", ppc: 92 },
  { week: "Semana 3", ppc: 78 },
  { week: "Semana 4", ppc: 88 },
  { week: "Semana 5", ppc: 95 },
  { week: "Semana 6", ppc: 89 },
];

const periodFilters = ["Dia", "Semana", "Mês", "Trimestre", "6M"];

export default function Dashboard() {
  const [activePeriod, setActivePeriod] = useState("Semana");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <Button asChild className="bg-accent-blue hover:bg-accent-dark-blue">
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>
      
      {/* Period Filter */}
      <div className="flex space-x-2 pb-2">
        {periodFilters.map(period => (
          <button
            key={period}
            className={`filter-button ${
              activePeriod === period ? "filter-button-active" : "filter-button-inactive"
            }`}
            onClick={() => setActivePeriod(period)}
          >
            {period}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="PPC Médio"
          value="85%"
          icon={<BarChart2 className="h-4 w-4" />}
          description="Últimas 4 semanas"
          className="border border-border-subtle shadow-md"
        />
        <DashboardCard
          title="Aderência"
          value="92%"
          icon={<Calendar className="h-4 w-4" />}
          description="Planejado vs. Executado"
          className="border border-border-subtle shadow-md"
        />
        <DashboardCard
          title="Atividades"
          value="54"
          icon={<FileText className="h-4 w-4" />}
          description="Em 4 projetos ativos"
          className="border border-border-subtle shadow-md"
        />
        <DashboardCard
          title="Atrasos"
          value="7"
          icon={<AlertTriangle className="h-4 w-4 text-accent-red" />}
          description="Atividades com PPC < 90%"
          className="border-l-4 border-l-accent-red border border-border-subtle shadow-md"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-card-bg border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Tendência de PPC</CardTitle>
            <CardDescription className="text-text-secondary">
              Evolução semanal do PPC no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="ppcColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D5EF1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1D5EF1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242A3D" />
                  <XAxis dataKey="week" stroke="#A9B0C5" />
                  <YAxis stroke="#A9B0C5" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1A1E2C",
                      borderColor: "#242A3D",
                      color: "#FFFFFF"
                    }} 
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
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-bg border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Principais Causas</CardTitle>
            <CardDescription className="text-text-secondary">
              Causas mais frequentes de baixo PPC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCauses.map((cause, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-text-primary">{cause.cause}</div>
                    <div className="text-sm text-text-secondary">
                      {cause.category}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-border rounded-full overflow-hidden mr-2">
                      <div
                        className="h-full bg-accent-red"
                        style={{ width: `${(cause.count / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{cause.count}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-border-subtle text-text-primary hover:bg-hover-bg" asChild>
                <Link to="/indicators/causes">Ver análise detalhada</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-card-bg border-border-subtle">
        <CardHeader>
          <CardTitle className="text-text-primary">Projetos Recentes</CardTitle>
          <CardDescription className="text-text-secondary">
            Visão geral dos projetos ativos e recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {mockProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full border-border-subtle text-text-primary hover:bg-hover-bg" asChild>
              <Link to="/projects">Ver todos os projetos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
