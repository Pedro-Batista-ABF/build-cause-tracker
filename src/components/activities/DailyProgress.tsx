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
import { DeleteProgressDialog } from "./DeleteProgressDialog";
import { formatLocalDate } from "@/utils/dateUtils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { calculatePPC } from "@/utils/ppcCalculation";
import { Activity, ActivityScheduleItem } from "@/types/database";

// NOVO: Calcular meta diária automática (quantidade e percentual)
// Atualizar função para pegar só dias úteis:
function calculateBusinessDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 0;
  let count = 0;
  let curr = new Date(startDate);
  const end = new Date(endDate);

  while (curr <= end) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) count++; // 0=Dom, 6=Sáb
    curr.setDate(curr.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

function calculateDailyGoal(startDate?: string | null, endDate?: string | null, totalQty?: number) {
  if (!startDate || !endDate || !totalQty || isNaN(totalQty)) return {qty: 0, percent: 0};
  try {
    const businessDays = calculateBusinessDays(startDate, endDate);
    const qtyGoal = Math.round(totalQty / businessDays);
    const percentGoal = Number((100 / businessDays).toFixed(2));
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [progressToDelete, setProgressToDelete] = useState<null | string>(null);
  
  // State for subactivities functionality
  const [hasDetailedSchedule, setHasDetailedSchedule] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ActivityScheduleItem[]>([]);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<string>("");

  const queryClient = useQueryClient();

  // Meta diária automática
  const {qty: plannedQty, percent: plannedPercent} = calculateDailyGoal(startDate, endDate, totalQty);

  // Now query activity to check if it has detailed schedule
  const { data: activityData } = useQuery({
    queryKey: ['activity-detail', activityId],
    queryFn: async () => {
      if (!session?.user) throw new Error("Não autenticado");

      const { data: activity, error } = await supabase
        .from('activities')
        .select('has_detailed_schedule')
        .eq('id', activityId)
        .single();

      if (error) {
        console.error('Error fetching activity data:', error);
        throw error;
      }

      if (activity?.has_detailed_schedule) {
        // If activity has detailed schedule, fetch subactivities
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('activity_schedule_items')
          .select('*')
          .eq('activity_id', activityId)
          .order('order_index');

        if (scheduleError) {
          console.error('Error fetching schedule items:', scheduleError);
          throw scheduleError;
        }

        setHasDetailedSchedule(true);
        if (scheduleData && scheduleData.length > 0) {
          setScheduleItems(scheduleData);
          setSelectedScheduleItem(scheduleData[0].id);
        }
      } else {
        setHasDetailedSchedule(false);
      }

      return activity;
    },
    enabled: !!session?.user && !!activityId
  });

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['progress', hasDetailedSchedule ? selectedScheduleItem || activityId : activityId],
    queryFn: async () => {
      if (!session?.user) throw new Error("Não autenticado");

      // If we have detailed schedule and a selected item, use that item's ID
      // Otherwise use the activity ID
      const targetId = hasDetailedSchedule && selectedScheduleItem ? selectedScheduleItem : activityId;

      const { data, error } = await supabase
        .from('daily_progress')
        .select('id, date, actual_qty, planned_qty')
        .eq('activity_id', targetId)
        .order('date');

      if (error) {
        console.error('Error fetching progress data:', error);
        toast.error("Erro ao carregar dados de progresso");
        throw error;
      }

      return data?.map(item => ({
        id: item.id,
        date: item.date,
        actual: Number(item.actual_qty),
        planned: Number(item.planned_qty)
      })) || [];
    },
    enabled: !!session?.user && (hasDetailedSchedule ? !!selectedScheduleItem : true)
  });

  const checkExistingProgress = async (itemId: string, date: string) => {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('id')
      .eq('activity_id', itemId)
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
      
      // If we have detailed schedule and a selected item, use that item's ID
      // Otherwise use the activity ID
      const targetId = hasDetailedSchedule && selectedScheduleItem ? selectedScheduleItem : activityId;
      const existingProgressId = await checkExistingProgress(targetId, date);

      let qtyValue: number;
      let plannedValue: number;

      // Get the target item for progress calculation
      const targetItem = hasDetailedSchedule && selectedScheduleItem
        ? scheduleItems.find(item => item.id === selectedScheduleItem) 
        : null;

      if (registerAsPercent) {
        // Avanço por percentual
        if (hasDetailedSchedule && targetItem) {
          // For subactivity, 100% means complete, so we just store the percentage
          qtyValue = Number(percent);
          plannedValue = plannedPercent;
        } else {
          // For regular activity, convert percent to quantity
          qtyValue = totalQty * (Number(percent) / 100);
          plannedValue = totalQty * (plannedPercent / 100);
        }
      } else {
        qtyValue = Number(quantity);
        plannedValue = plannedQty;
      }

      // Ensure qtyValue is a valid number (not NaN)
      qtyValue = isNaN(qtyValue) ? 0 : qtyValue;
      plannedValue = isNaN(plannedValue) ? 0 : plannedValue;

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
            activity_id: targetId,
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

      // If this is a subactivity progress, update the percent_complete on the subactivity
      if (hasDetailedSchedule && targetItem && selectedScheduleItem) {
        // Calculate new percent complete based on all progress entries for this subactivity
        const { data: allProgress, error: progressError } = await supabase
          .from('daily_progress')
          .select('actual_qty, planned_qty')
          .eq('activity_id', selectedScheduleItem);
        
        if (progressError) {
          console.error("Error fetching all progress data:", progressError);
        } else if (allProgress && allProgress.length > 0) {
          // Calculate progress percentage (use PPC calculation)
          // For subactivities we use the most recent progress entry as the current percent
          const newPercent = Number(qtyValue);
          
          // Update subactivity percent complete
          const { error: updateError } = await supabase
            .from('activity_schedule_items')
            .update({
              percent_complete: newPercent,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedScheduleItem);
            
          if (updateError) {
            console.error("Error updating subactivity percent complete:", updateError);
          }
          
          // Calculate and update parent activity's progress based on all subactivities
          const { data: allSubactivities } = await supabase
            .from('activity_schedule_items')
            .select('percent_complete')
            .eq('activity_id', activityId);
            
          if (allSubactivities && allSubactivities.length > 0) {
            // Average all subactivities' percent complete
            const totalPercent = allSubactivities.reduce((sum, item) => sum + (item.percent_complete || 0), 0);
            const avgPercent = totalPercent / allSubactivities.length;
            
            // Update parent activity's PPC based on subactivities
            const { error: activityUpdateError } = await supabase
              .from('activities')
              .update({
                ppc: Math.round(avgPercent),
                schedule_percent_complete: Math.round(avgPercent),
                updated_at: new Date().toISOString()
              })
              .eq('id', activityId);
              
            if (activityUpdateError) {
              console.error("Error updating parent activity PPC:", activityUpdateError);
            }
          }
        }
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
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity-details'] });
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
      
      // If this is a subactivity, update its percent complete
      if (hasDetailedSchedule && selectedScheduleItem) {
        const { error: updateError } = await supabase
          .from('activity_schedule_items')
          .update({
            percent_complete: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedScheduleItem);
          
        if (updateError) {
          console.error("Error updating subactivity percent complete:", updateError);
        }
        
        // Calculate and update parent activity's progress
        const { data: allSubactivities } = await supabase
          .from('activity_schedule_items')
          .select('percent_complete')
          .eq('activity_id', activityId);
          
        if (allSubactivities && allSubactivities.length > 0) {
          const totalPercent = allSubactivities.reduce((sum, item) => sum + (item.percent_complete || 0), 0);
          const avgPercent = totalPercent / allSubactivities.length;
          
          await supabase
            .from('activities')
            .update({
              ppc: Math.round(avgPercent),
              schedule_percent_complete: Math.round(avgPercent)
            })
            .eq('id', activityId);
        }
      }
    },
    onSuccess: () => {
      toast.success("Avanço atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedProgress(null);
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity-details'] });
    },
    onError: error => {
      console.error("Erro ao editar avanço:", error);
      toast.error("Erro ao editar avanço");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert inputs to numbers and handle empty inputs
    const numericQuantity = quantity === "" ? 0 : Number(quantity);
    const numericPercent = percent === "" ? 0 : Number(percent);
    
    if (registerAsPercent) {
      // Allow zero percent progress without causing prompt
      if (numericPercent < plannedPercent) {
        setShowCauseDialog(true);
        return;
      }
      submitProgressMutation.mutate({ percent: numericPercent, date });
    } else {
      // Allow zero quantity progress without causing prompt
      if (numericQuantity < plannedQty) {
        setShowCauseDialog(true);
        return;
      }
      submitProgressMutation.mutate({ quantity: numericQuantity, date });
    }
  };

  const handleCauseSubmit = (cause: { type: string; description: string }) => {
    if (registerAsPercent) {
      const numericPercent = percent === "" ? 0 : Number(percent);
      submitProgressMutation.mutate({ 
        percent: numericPercent, 
        date, 
        cause 
      });
    } else {
      const numericQuantity = quantity === "" ? 0 : Number(quantity);
      submitProgressMutation.mutate({ 
        quantity: numericQuantity, 
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

  // Handle schedule item selection
  const handleScheduleItemChange = (value: string) => {
    setSelectedScheduleItem(value);
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
              {hasDetailedSchedule ? (
                <div className="mb-2">
                  <Label className="mb-1 block">Selecione a subatividade para apontar progresso:</Label>
                  <Select value={selectedScheduleItem} onValueChange={handleScheduleItemChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma subatividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.percent_complete}% concluído
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    O avanço será registrado para a subatividade selecionada.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-1">
                  Meta diária:
                  <span className="ml-1 font-medium">{plannedQty} {unit}/dia</span>
                  <span> | </span>
                  <span className="font-medium">{plannedPercent}%/dia</span>
                </p>
              )}
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
                    <DialogTitle>
                      {hasDetailedSchedule 
                        ? `Registrar Avanço da Subatividade` 
                        : `Registrar Avanço Diário`}
                    </DialogTitle>
                    <DialogDescription>
                      {hasDetailedSchedule && selectedScheduleItem 
                        ? `${scheduleItems.find(item => item.id === selectedScheduleItem)?.name || 'Subatividade'}`
                        : activityName}
                    </DialogDescription>
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
                        <Label htmlFor="quantity">Quantidade ({hasDetailedSchedule ? '%' : unit})</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder={`0 ${hasDetailedSchedule ? '%' : unit}`}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          min="0"
                          max={hasDetailedSchedule ? "100" : totalQty.toString()}
                          required
                        />
                        <div className="text-xs text-muted-foreground">
                          Meta diária: {plannedQty} {hasDetailedSchedule ? '%' : unit}
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
          <div className="mt-4">
            {progressData && progressData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs bg-muted/40 rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 font-semibold">Data</th>
                      <th className="px-2 py-1">
                        {hasDetailedSchedule ? 'Percentual (%)' : `Quantidade (${unit})`}
                      </th>
                      <th className="px-2 py-1">Meta Diária</th>
                      <th className="px-2 py-1 text-center" colSpan={2}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressData.map((p, idx) => {
                      const dailyGoal = calculateDailyGoal(startDate, endDate, totalQty);
                      return (
                        <tr key={p.date} className="border-t">
                          <td className="px-2 py-1">{formatLocalDate(p.date)}</td>
                          <td className="px-2 py-1 text-center">{p.actual}{hasDetailedSchedule && '%'}</td>
                          <td className="px-2 py-1 text-center">
                            {dailyGoal.qty} {hasDetailedSchedule ? '%' : unit}
                          </td>
                          <td className="px-2 py-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedProgress({ id: p.id, date: p.date, actual: p.actual, planned: dailyGoal.qty });
                                setEditDialogOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                          </td>
                          <td className="px-2 py-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setProgressToDelete(p.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Apagar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <EditProgressDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              progress={selectedProgress}
              unit={hasDetailedSchedule ? "%" : unit}
              onSave={newValue => {
                if (selectedProgress) {
                  editProgressMutation.mutate({ progressId: selectedProgress.id, newValue });
                }
              }}
            />

            <DeleteProgressDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              progressId={progressToDelete}
              onDeleted={() => {
                queryClient.invalidateQueries({ queryKey: ['progress'] });
                queryClient.invalidateQueries({ queryKey: ['activities'] });
                queryClient.invalidateQueries({ queryKey: ['activity-details'] });
                setProgressToDelete(null);
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
        <ActivityProgressChart 
          data={progressData} 
          unit={hasDetailedSchedule ? "%" : unit} 
        />
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
