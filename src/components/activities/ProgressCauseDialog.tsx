
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface Cause {
  id: string;
  name: string;
  category: string;
}

interface ProgressCauseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (cause: { type: string; description: string }) => void;
}

export function ProgressCauseDialog({
  open,
  onOpenChange,
  onSubmit,
}: ProgressCauseDialogProps) {
  const [selectedCause, setSelectedCause] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use React Query to fetch causes
  const { data: causes = [], isLoading } = useQuery({
    queryKey: ['causes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('causes')
        .select('*')
        .order('category');
      
      if (error) {
        console.error('Error fetching causes:', error);
        toast.error("Erro ao carregar causas");
        return [];
      }
      
      // Filter out any causes with empty ids
      return (data || []).filter(cause => cause.id);
    },
    // Only fetch when dialog is open
    enabled: open,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedCause("");
      setDescription("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    onSubmit({
      type: selectedCause,
      description,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar Causa do Desvio</AlertDialogTitle>
          <AlertDialogDescription>
            O avanço registrado difere do planejado. Por favor, informe a causa do desvio.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cause">Causa</Label>
            {isLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            ) : (
              <Select
                value={selectedCause}
                onValueChange={setSelectedCause}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a causa" />
                </SelectTrigger>
                <SelectContent>
                  {causes.map((cause) => (
                    <SelectItem key={cause.id} value={cause.id}>
                      {cause.name} ({cause.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes da causa..."
              disabled={isSubmitting}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCause || isSubmitting}
          >
            {isSubmitting ? "Confirmando..." : "Confirmar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
