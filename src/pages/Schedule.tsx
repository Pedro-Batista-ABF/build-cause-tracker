
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AlertCircle, Upload, FileUp, BarChart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScheduleGantt } from "@/components/schedule/ScheduleGantt";
import { ScheduleImportDialog } from "@/components/schedule/ScheduleImportDialog";
import { ScheduleAnalysisDialog } from "@/components/schedule/ScheduleAnalysisDialog";

export default function Schedule() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectInfo();
      fetchScheduleData();
    } else {
      navigate("/projects");
    }
  }, [projectId]);

  async function fetchProjectInfo() {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      if (data) {
        setProjectName(data.name);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Erro ao carregar informações do projeto");
    }
  }

  async function fetchScheduleData() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("cronograma_projeto")
        .select("*")
        .eq("projeto_id", projectId)
        .order("nivel_hierarquia", { ascending: true })
        .order("wbs", { ascending: true });

      if (error) throw error;
      setScheduleData(data || []);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
      toast.error("Erro ao carregar dados do cronograma");
    } finally {
      setIsLoading(false);
    }
  }

  const handleImportSuccess = () => {
    fetchScheduleData();
    toast.success("Cronograma importado com sucesso!");
    setImportDialogOpen(false);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{projectName}</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie o cronograma do projeto
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setAnalysisDialogOpen(true)}
            className="gap-2"
            variant="outline"
          >
            <BarChart className="h-4 w-4" />
            Análise Crítica
          </Button>
          <Button 
            onClick={() => setImportDialogOpen(true)}
            className="gap-2"
          >
            <FileUp className="h-4 w-4" />
            Importar Cronograma
          </Button>
        </div>
      </div>

      <Separator />

      {scheduleData.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhum cronograma encontrado</AlertTitle>
              <AlertDescription>
                Importe um cronograma do MS Project para visualizar as tarefas e prazos.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setImportDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar arquivo .XML do MS Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScheduleGantt 
          scheduleData={scheduleData}
          isLoading={isLoading}
          projectId={projectId || ""}
          onDataChange={fetchScheduleData}
        />
      )}

      <ScheduleImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId || ""}
        onImportSuccess={handleImportSuccess}
      />

      <ScheduleAnalysisDialog
        open={analysisDialogOpen}
        onOpenChange={setAnalysisDialogOpen}
        projectId={projectId || ""}
        scheduleData={scheduleData}
      />
    </div>
  );
}
