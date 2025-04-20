
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
  const handleDelete = async () => {
    try {
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
    }
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a atividade "{activityName}"? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
