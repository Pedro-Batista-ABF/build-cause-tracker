
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "@/components/projects/ProjectCard";

interface Project {
  id: string;
  name: string;
  client: string;
  contract: string;
  startDate: string;
  endDate: string;
  status: "active" | "delayed" | "inactive";
  ppc: number;
}

interface RecentProjectsProps {
  projects: Project[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <Card className="bg-card-bg border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-primary">Projetos Recentes</CardTitle>
        <CardDescription className="text-text-secondary">
          Visão geral dos projetos ativos e recentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
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
  );
}
