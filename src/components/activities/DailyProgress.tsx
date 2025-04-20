
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
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [open, setOpen] = useState(false);
  const [showCauseDialog, setShowCauseDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch progress data
  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['progress', activityId],
    queryFn: async () => {
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
    }
  });

  // Submit progress mutation
  const submitProgressMutation = useMutation({
    mutationFn: async ({ quantity, date, cause }: { 
      quantity: number, 
      date: string, 
      cause?: { type: string; description: string } 
    }) => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Usuário não autenticado");
      }
      
      // Insert progress data with user ID
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress')
        .insert([{
          activity_id: activityId,
          date,
          actual_qty: Number(quantity),
          planned_qty: plannedProgress,
          created_by: session.user.id // Set authenticated user ID
        }])
        .select('id')
        .single();

      if (progressError) throw progressError;

      if (cause && progressData) {
        const { error: causeError } = await supabase
          .from('progress_causes')
          .insert([{
            progress_id: progressData.id,
            cause_id: cause.type,
            notes: cause.description,
            created_by: session.user.id // Set authenticated user ID
          }]);

        if (causeError) throw causeError;
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
      toast.error("Erro ao registrar avanço");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const progress = Number(quantity);
    const threshold = 0.1;
    const difference = Math.abs(progress - plannedProgress);
    
    if (difference > threshold * plannedProgress) {
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
                      onClick={() => setOpen(false)}
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
        onOpenChange={setShowCauseDialog}
        onSubmit={handleCauseSubmit}
      />
    </div>
  );
}
