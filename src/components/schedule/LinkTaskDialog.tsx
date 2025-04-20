import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity } from "@/types/schedule";

interface LinkTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    nome: string;
  };
  projectId: string;
  currentActivityId?: string;
  onLinkSuccess: (taskId: string, activityName: string) => void;
}

export function LinkTaskDialog({
  open,
  onOpenChange,
  task,
  projectId,
  currentActivityId,
  onLinkSuccess
}: LinkTaskDialogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>(currentActivityId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchActivities();
    }
  }, [open, projectId]);

  useEffect(() => {
    setSelectedActivity(currentActivityId || "");
  }, [currentActivityId]);

  async function fetchActivities() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("id, name, discipline")
        .eq("project_id", projectId)
        .order("name");

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Erro ao carregar atividades");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let activityName = "";
      
      if (selectedActivity) {
        const activity = activities.find(a => a.id === selectedActivity);
        if (activity) {
          activityName = activity.name;
        }
      }
      
      const { error } = await supabase
        .from('cronograma_projeto')
        .update({ atividade_lps_id: selectedActivity || null })
        .eq('id', task.id);

      if (error) throw error;
      
      toast.success(
        selectedActivity 
          ? "Tarefa vinculada com sucesso" 
          : "Vinculação removida com sucesso"
      );
      
      onLinkSuccess(task.id, activityName);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating task link:", error);
      toast.error("Erro ao vincular tarefa");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vincular Tarefa à Atividade</DialogTitle>
          <DialogDescription>
            Vincule a tarefa do cronograma "{task.nome}" a uma atividade existente no LPS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity">Atividade</Label>
            <Select value={selectedActivity} onValueChange={setSelectedActivity} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma atividade" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.name} {activity.discipline ? `(${activity.discipline})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentActivityId && (
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedActivity("")}
                  className="text-destructive"
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Remover vinculação
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
