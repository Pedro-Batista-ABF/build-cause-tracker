
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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // First delete all related daily progress records
      const { error: progressError } = await supabase
        .from('daily_progress')
        .delete()
        .eq('activity_id', activityId);
      
      if (progressError) {
        console.error('Error deleting related daily progress:', progressError);
        toast.error("Erro ao remover registros de progresso da atividade");
        return;
      }
      
      // Delete any related schedule items
      const { error: scheduleError } = await supabase
        .from('activity_schedule_items')
        .delete()
        .eq('activity_id', activityId);
        
      if (scheduleError) {
        console.error('Error deleting related schedule items:', scheduleError);
        // Continue with activity deletion even if this fails
      }
      
      // Now delete the activity
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast.success("Atividade excluída com sucesso");
      
      // Call the onDelete callback to update local state
      onDelete();
      
      // Close the dialog
      onClose();
      
      // Use React Router to navigate instead of reloading the page
      // This will be much faster and preserve React's state
      navigate('/activities', { replace: true });
      
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error("Erro ao excluir atividade");
    } finally {
      setIsDeleting(false);
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
              <p className="mt-2 font-medium text-destructive">Excluindo atividade...</p>
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
