
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  client: string | null;
  contract: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  ppc: number | null;
}

export function RecentProjects() {
  const fetchRecentProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Erro ao buscar projetos recentes:", error);
      throw new Error("Falha ao carregar projetos recentes");
    }

    return data || [];
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["recentProjects"],
    queryFn: fetchRecentProjects,
  });

  return (
    <Card className="bg-card-bg border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-primary">Projetos Recentes</CardTitle>
        <CardDescription className="text-text-secondary">
          Visão geral dos projetos ativos e recentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-text-secondary">Carregando projetos...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project: Project) => (
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
        ) : (
          <div className="text-center py-4">
            <p className="text-text-secondary">Nenhum projeto cadastrado ainda.</p>
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" className="w-full border-border-subtle text-text-primary hover:bg-hover-bg" asChild>
            <Link to="/projects">Ver todos os projetos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
