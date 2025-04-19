
import { useState } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const progress = Number(quantity);
    const threshold = 0.1; // 10% difference threshold
    const difference = Math.abs(progress - plannedProgress);
    
    if (difference > threshold * plannedProgress) {
      setShowCauseDialog(true);
      return;
    }
    
    submitProgress();
  };

  const submitProgress = async (cause?: { type: string; description: string }) => {
    try {
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress')
        .insert([{
          activity_id: activityId,
          date,
          actual_qty: Number(quantity),
          planned_qty: plannedProgress
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
            notes: cause.description
          }]);

        if (causeError) throw causeError;
      }

      toast.success("Avanço registrado com sucesso!");
      setOpen(false);
      setQuantity("");
      setShowCauseDialog(false);
    } catch (error) {
      console.error('Error submitting progress:', error);
      toast.error("Erro ao registrar avanço");
    }
  };

  const handleCauseSubmit = (cause: { type: string; description: string }) => {
    submitProgress(cause);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Registrar Avanço
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Avanço Diário</DialogTitle>
            <DialogDescription>
              {activityName}
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ProgressCauseDialog
        open={showCauseDialog}
        onOpenChange={setShowCauseDialog}
        onSubmit={handleCauseSubmit}
      />
    </>
  );
}

