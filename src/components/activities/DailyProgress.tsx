
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ProgressCauseDialog } from "./ProgressCauseDialog";
import { supabase } from "@/integrations/supabase/client";
import { ActivityProgressChart } from "./ActivityProgressChart";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

interface DailyProgressProps {
  activityId: string;
  activityName: string;
  unit: string;
  totalQty: number;
  plannedProgress?: number;
}

export function DailyProgress({ 
  activityId, 
  activityName, 
  unit, 
  totalQty,
  plannedProgress = 10,
}: DailyProgressProps) {
  const { session } = useAuth();
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [open, setOpen] = useState(false);
  const [showCauseDialog, setShowCauseDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch progress data
  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['progress', activityId],
    queryFn: async () => {
      if (!session?.user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('activity_id', activityId)
        .order('date');

      if (error) {
        console.error('Error fetching progress data:', error);
        toast.error("Erro ao carregar dados de progresso");
        throw error;
      }

      return data?.map(item => ({
        date: item.date,
        actual: Number(item.actual_qty),
        planned: Number(item.planned_qty)
      })) || [];
    },
    enabled: !!session?.user
  });

  // Check for existing progress on the selected date
  const checkExistingProgress = async (activityId: string, date: string) => {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('id')
      .eq('activity_id', activityId)
      .eq('date', date)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking for existing progress:', error);
      return null;
    }
    
    return data?.id;
  };

  // Submit progress mutation
  const submitProgressMutation = useMutation({
    mutationFn: async ({ quantity, date, cause }: { 
      quantity: number, 
      date: string, 
      cause?: { type: string; description: string } 
    }) => {
      if (!session?.user) throw new Error("Usuário não autenticado");
      
      console.log("Starting progress submission");
      
      // Check if progress for this activity and date already exists
      const existingProgressId = await checkExistingProgress(activityId, date);
      
      let progressData;
      
      if (existingProgressId) {
        // Update existing record
        const { data, error: updateError } = await supabase
          .from('daily_progress')
          .update({
            actual_qty: Number(quantity),
            planned_qty: plannedProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgressId)
          .select('id')
          .single();
          
        if (updateError) {
          console.error("Error updating daily progress:", updateError);
          throw updateError;
        }
        progressData = data;
        console.log("Progress entry updated successfully, ID:", progressData.id);
      } else {
        // Insert new record
        const { data, error: progressError } = await supabase
          .from('daily_progress')
          .insert([{
            activity_id: activityId,
            date,
            actual_qty: Number(quantity),
            planned_qty: plannedProgress,
            created_by: session.user.id
          }])
          .select('id')
          .single();

        if (progressError) {
          console.error("Error inserting daily progress:", progressError);
          throw progressError;
        }
        progressData = data;
        console.log("Progress entry created successfully, ID:", progressData.id);
      }

      if (cause && progressData) {
        console.log("Inserting cause data:", cause);
        
        const { error: causeError } = await supabase
          .from('progress_causes')
          .insert([{
            progress_id: progressData.id,
            cause_id: cause.type,
            notes: cause.description,
            created_by: session.user.id
          }]);

        if (causeError) {
          console.error("Error inserting cause:", causeError);
          throw causeError;
        }
        
        console.log("Cause entry created successfully");
      }

      return progressData;
    },
    onSuccess: () => {
      toast.success("Avanço registrado com sucesso!");
      setOpen(false);
      setQuantity("");
      setShowCauseDialog(false);
      // Refresh progress data
      queryClient.invalidateQueries({ queryKey: ['progress', activityId] });
      // Also refresh activities list to update progress indicators
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => {
      console.error('Error submitting progress:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao registrar avanço");
      // Always close dialogs on error to prevent them from getting stuck
      setOpen(false);
      setShowCauseDialog(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const progress = Number(quantity);
    
    // Only show cause dialog when progress is less than planned
    // This fixes the issue where deviations were required for progress above plan
    if (progress < plannedProgress) {
      setShowCauseDialog(true);
      return;
    }
    
    submitProgressMutation.mutate({ quantity: Number(quantity), date });
  };

  const handleCauseSubmit = (cause: { type: string; description: string }) => {
    submitProgressMutation.mutate({ 
      quantity: Number(quantity), 
      date, 
      cause 
    });
  };
  
  // Handle dialog cancel properly
  const handleDialogCancel = () => {
    setOpen(false);
    setShowCauseDialog(false);
    setQuantity("");
  };

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Faça login para registrar o avanço da atividade.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{activityName}</h3>
              <p className="text-sm text-muted-foreground">
                Meta: {plannedProgress} {unit}/dia
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Registrar Avanço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Avanço Diário</DialogTitle>
                  <DialogDescription>{activityName}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade ({unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder={`0 ${unit}`}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="0"
                      max={totalQty}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDialogCancel}
                      disabled={submitProgressMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={submitProgressMutation.isPending}
                    >
                      {submitProgressMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando dados de progresso...</p>
        </div>
      ) : (
        <ActivityProgressChart data={progressData} unit={unit} />
      )}

      <ProgressCauseDialog
        open={showCauseDialog}
        onOpenChange={(open) => {
          // Ensure proper closing of nested dialog
          setShowCauseDialog(open);
          if (!open) setOpen(false);
        }}
        onSubmit={handleCauseSubmit}
      />
    </div>
  );
}
