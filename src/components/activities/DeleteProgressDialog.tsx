
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressId: string | null;
  onDeleted: () => void;
}

export function DeleteProgressDialog({
  open,
  onOpenChange,
  progressId,
  onDeleted,
}: DeleteProgressDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!progressId) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from("daily_progress")
      .delete()
      .eq("id", progressId);
    setIsDeleting(false);
    if (error) {
      toast.error("Erro ao apagar avanço!");
    } else {
      toast.success("Registro de avanço apagado!");
      onDeleted();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar Avanço</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja apagar este registro de avanço? Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Apagando..." : "Apagar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
