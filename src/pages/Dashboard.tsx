
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
import { BarChart, Calendar, Clock, FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";

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

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          icon={<FileText className="h-4 w-4" />}
          description="Em 4 projetos ativos"
        />
        <DashboardCard
          title="Atrasos"
          value="7"
          icon={<Clock className="h-4 w-4" />}
          description="Atividades com PPC < 90%"
          className="border-l-4 border-l-rust"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>
              Visão geral dos projetos ativos e recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/projects">Ver todos os projetos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais Causas</CardTitle>
            <CardDescription>
              Causas mais frequentes de baixo PPC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCauses.map((cause, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{cause.cause}</div>
                    <div className="text-sm text-muted-foreground">
                      {cause.category}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden mr-2">
                      <div
                        className="h-full bg-rust"
                        style={{ width: `${(cause.count / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{cause.count}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/indicators/causes">Ver análise detalhada</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
