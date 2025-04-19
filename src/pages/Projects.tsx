
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Project = {
  id: string;
  name: string;
  client: string | null;
  contract: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  ppc: number | null;
};

export default function Projects() {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar projetos:", error);
      throw new Error("Falha ao carregar projetos");
    }

    return data || [];
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const filteredProjects = projects.filter((project: Project) => {
    const matchesFilter =
      project.name.toLowerCase().includes(filter.toLowerCase()) ||
      (project.client && project.client.toLowerCase().includes(filter.toLowerCase())) ||
      (project.contract && project.contract.toLowerCase().includes(filter.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || (project.status && project.status === statusFilter);

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

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando projetos...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project: Project) => (
                  <ProjectCard 
                    key={project.id} 
                    id={project.id}
                    name={project.name}
                    client={project.client || ""}
                    contract={project.contract || ""}
                    startDate={project.start_date || ""}
                    endDate={project.end_date || ""}
                    status={(project.status as 'active' | 'inactive' | 'delayed') || "active"}
                    ppc={project.ppc || 0}
                  />
                ))}
              </div>

              {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum projeto encontrado com os filtros aplicados.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
