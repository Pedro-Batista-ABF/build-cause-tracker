import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { ProjectEditDialog } from "@/components/projects/ProjectEditDialog";
import { ProjectMetrics } from "@/components/projects/ProjectMetrics";
import { ProjectActivities } from "@/components/projects/ProjectActivities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  name: string;
  description: string | null;
  client: string | null;
  contract: string | null;
  created_at: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  ppc: number | null;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const mockProgressData = [
    { date: "2024-01-01", value: 10 },
    { date: "2024-02-01", value: 25 },
    { date: "2024-03-01", value: 45 },
    { date: "2024-04-01", value: 65 },
  ];

  useEffect(() => {
    fetchProject();
  }, [id]);

  async function fetchProject() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject() {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Projeto excluído com sucesso");
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Erro ao excluir projeto");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Projetos
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Projeto não encontrado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Projetos
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-muted-foreground">Cliente</dt>
                <dd className="mt-1">{project.client || "Não informado"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Contrato</dt>
                <dd className="mt-1">{project.contract || "Não informado"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Descrição</dt>
                <dd className="mt-1">{project.description || "Sem descrição"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1 capitalize">{project.status || "Não definido"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Data de Início</dt>
                <dd className="mt-1">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString("pt-BR")
                    : "Não definida"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Data de Término</dt>
                <dd className="mt-1">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString("pt-BR")
                    : "Não definida"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <ProjectMetrics project={project} progressData={mockProgressData} />
        
        <ProjectActivities projectId={project.id} />
      </div>

      <ProjectEditDialog
        project={project}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProjectUpdated={fetchProject}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
