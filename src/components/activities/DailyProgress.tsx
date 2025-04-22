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
import { EditProgressDialog } from "./EditProgressDialog";

// NOVO: Calcular meta diária automática (quantidade e percentual)
function calculateDailyGoal(startDate?: string | null, endDate?: string | null, totalQty?: number) {
  if (!startDate || !endDate || !totalQty || isNaN(totalQty)) return {qty: 0, percent: 0};
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const qtyGoal = Math.round(totalQty / duration);
    const percentGoal = Number((100 / duration).toFixed(2));
    return {qty: qtyGoal, percent: percentGoal};
  } catch {
    return {qty: 0, percent: 0};
  }
}

interface DailyProgressProps {
  activityId: string;
  activityName: string;
  unit: string;
  totalQty: number;
  startDate?: string | null;
  endDate?: string | null;
}

export function DailyProgress({ 
  activityId, 
  activityName, 
  unit, 
  totalQty,
  startDate,
  endDate,
}: DailyProgressProps) {
  const { session } = useAuth();
  const [quantity, setQuantity] = useState("");
  const [percent, setPercent] = useState("");
  const [registerAsPercent, setRegisterAsPercent] = useState(false); // Novo: toggle opção de avanço por percentual
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [open, setOpen] = useState(false);
  const [showCauseDialog, setShowCauseDialog] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<null | {id: string, date: string, actual: number, planned: number}>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Meta diária automática
  const {qty: plannedQty, percent: plannedPercent} = calculateDailyGoal(startDate, endDate, totalQty);

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

  const submitProgressMutation = useMutation({
    mutationFn: async ({ quantity, percent, date, cause }: { 
      quantity?: number, 
      percent?: number,
      date: string, 
      cause?: { type: string; description: string } 
    }) => {
      if (!session?.user) throw new Error("Usuário não autenticado");
      const existingProgressId = await checkExistingProgress(activityId, date);

      let qtyValue: number;
      let plannedValue: number;

      if (registerAsPercent) {
        // Avanço por percentual. Calcula quantidade com base no percentual.
        qtyValue = totalQty * (Number(percent) / 100);
        plannedValue = totalQty * (plannedPercent / 100);
      } else {
        qtyValue = Number(quantity);
        plannedValue = plannedQty;
      }

      let progressData;
      if (existingProgressId) {
        const { data, error: updateError } = await supabase
          .from('daily_progress')
          .update({
            actual_qty: qtyValue,
            planned_qty: plannedValue,
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
      } else {
        const { data, error: progressError } = await supabase
          .from('daily_progress')
          .insert([{
            activity_id: activityId,
            date,
            actual_qty: qtyValue,
            planned_qty: plannedValue,
            created_by: session.user.id
          }])
          .select('id')
          .single();

        if (progressError) {
          console.error("Error inserting daily progress:", progressError);
          throw progressError;
        }
        progressData = data;
      }

      if (cause && progressData) {
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
      }
      return progressData;
    },
    onSuccess: () => {
      toast.success("Avanço registrado com sucesso!");
      setOpen(false);
      setQuantity("");
      setPercent("");
      setShowCauseDialog(false);
      queryClient.invalidateQueries({ queryKey: ['progress', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => {
      console.error('Error submitting progress:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao registrar avanço");
      setOpen(false);
      setShowCauseDialog(false);
    }
  });

  // Nova função: atualizar avanço já registrado
  const editProgressMutation = useMutation({
    mutationFn: async ({ progressId, newValue }: { progressId: string; newValue: number }) => {
      if (!session?.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('daily_progress')
        .update({
          actual_qty: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);

      if (error) {
        console.error("Erro ao editar avanço:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Avanço atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedProgress(null);
      queryClient.invalidateQueries({ queryKey: ['progress', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: error => {
      console.error("Erro ao editar avanço:", error);
      toast.error("Erro ao editar avanço");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerAsPercent) {
      const percentValue = Number(percent);
      if (percentValue < plannedPercent) {
        setShowCauseDialog(true);
        return;
      }
      submitProgressMutation.mutate({ percent: percentValue, date });
    } else {
      const progress = Number(quantity);
      if (progress < plannedQty) {
        setShowCauseDialog(true);
        return;
      }
      submitProgressMutation.mutate({ quantity: Number(quantity), date });
    }
  };

  const handleCauseSubmit = (cause: { type: string; description: string }) => {
    if (registerAsPercent) {
      submitProgressMutation.mutate({ 
        percent: Number(percent), 
        date, 
        cause 
      });
    } else {
      submitProgressMutation.mutate({ 
        quantity: Number(quantity), 
        date, 
        cause 
      });
    }
  };

  const handleDialogCancel = () => {
    setOpen(false);
    setShowCauseDialog(false);
    setQuantity("");
    setPercent("");
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
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="font-semibold">{activityName}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Meta diária:
                <span className="ml-1 font-medium">{plannedQty} {unit}/dia</span>
                <span> | </span>
                <span className="font-medium">{plannedPercent}%/dia</span>
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={registerAsPercent}
                  onChange={() => {
                    setRegisterAsPercent((v) => !v);
                    setQuantity("");
                    setPercent("");
                  }}
                />
                Avançar por percentual
              </label>
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
                    {!registerAsPercent ? (
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
                        <div className="text-xs text-muted-foreground">
                          Meta diária: {plannedQty} {unit}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="percent">Percentual (%)</Label>
                        <Input
                          id="percent"
                          type="number"
                          placeholder="0%"
                          min="0"
                          max="100"
                          step="0.01"
                          value={percent}
                          onChange={(e) => setPercent(e.target.value)}
                          required
                        />
                        <div className="text-xs text-muted-foreground">
                          Meta diária: {plannedPercent}%
                        </div>
                      </div>
                    )}
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
          </div>
          {/* NOVO: Botão de editar avanço registrado do dia */}
          <div className="mt-4">
            {progressData && progressData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs bg-muted/40 rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 font-semibold">Data</th>
                      <th className="px-2 py-1">Quantidade ({unit})</th>
                      <th className="px-2 py-1">Previsto</th>
                      <th className="px-2 py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressData.map((p, idx) => (
                      <tr key={p.date} className="border-t">
                        <td className="px-2 py-1">{p.date}</td>
                        <td className="px-2 py-1 text-center">{p.actual}</td>
                        <td className="px-2 py-1 text-center">{p.planned}</td>
                        <td className="px-2 py-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProgress({ id: p.id, date: p.date, actual: p.actual, planned: p.planned });
                              setEditDialogOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Diálogo de edição de avanço */}
            <EditProgressDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              progress={selectedProgress}
              unit={unit}
              onSave={newValue => {
                if (selectedProgress) {
                  editProgressMutation.mutate({ progressId: selectedProgress.id, newValue });
                }
              }}
            />
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
          setShowCauseDialog(open);
          if (!open) setOpen(false);
        }}
        onSubmit={handleCauseSubmit}
      />
    </div>
  );
}
