
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DeleteActivityDialogProps {
  activityId: string;
  activityName: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteActivityDialog({
  activityId,
  activityName,
  isOpen,
  onClose,
  onDelete,
}: DeleteActivityDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Primeiro, verificamos e removemos as referências na tabela cronograma_projeto
      const { error: scheduleError } = await supabase
        .from('cronograma_projeto')
        .delete()
        .eq('atividade_lps_id', activityId);
      
      if (scheduleError) {
        console.error('Error deleting related schedule entries:', scheduleError);
        toast.error("Erro ao remover referências da atividade no cronograma");
        return;
      }
      
      // Também precisamos remover os registros de progresso diário
      const { error: progressError } = await supabase
        .from('daily_progress')
        .delete()
        .eq('activity_id', activityId);
      
      if (progressError) {
        console.error('Error deleting related daily progress:', progressError);
        toast.error("Erro ao remover registros de progresso da atividade");
        return;
      }
      
      // Agora podemos excluir a atividade
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast.success("Atividade excluída com sucesso");
      onDelete();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error("Erro ao excluir atividade");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a atividade "{activityName}"? Esta ação não pode ser desfeita.
            {isDeleting && (
              <p className="mt-2 font-medium text-destructive">Removendo referências e excluindo atividade...</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
