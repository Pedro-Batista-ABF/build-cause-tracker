
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
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
  {
    id: "4",
    name: "Manutenção Preventiva Norte",
    client: "Empresa D",
    contract: "CT-2023-004",
    startDate: "2023-04-01",
    endDate: "2023-10-31",
    status: "active" as const,
    ppc: 87,
  },
  {
    id: "5",
    name: "Reforma Unidade Central",
    client: "Empresa E",
    contract: "CT-2023-005",
    startDate: "2023-05-15",
    endDate: "2023-12-15",
    status: "active" as const,
    ppc: 92,
  },
];

export default function Projects() {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProjects = mockProjects.filter((project) => {
    const matchesFilter =
      project.name.toLowerCase().includes(filter.toLowerCase()) ||
      project.client.toLowerCase().includes(filter.toLowerCase()) ||
      project.contract.toLowerCase().includes(filter.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesFilter && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
          <CardDescription>
            Gerenciamento de projetos e contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                className="pl-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="delayed">Atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum projeto encontrado com os filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
