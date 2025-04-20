
import { useState } from "react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditScheduleItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    nome: string;
    data_inicio: string | null;
    data_termino: string | null;
    percentual_real: number | null;
  };
  onSave: () => void;
}

export function EditScheduleItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: EditScheduleItemDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    item.data_inicio ? new Date(item.data_inicio) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    item.data_termino ? new Date(item.data_termino) : undefined
  );
  const [progress, setProgress] = useState(item.percentual_real?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast.error("Datas de início e término são obrigatórias");
      return;
    }

    const progressValue = Number(progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      toast.error("Percentual deve ser um número entre 0 e 100");
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("cronograma_projeto")
        .update({
          data_inicio: startDate.toISOString().split("T")[0],
          data_termino: endDate.toISOString().split("T")[0],
          percentual_real: progressValue,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item atualizado com sucesso");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating schedule item:", error);
      toast.error("Erro ao atualizar item do cronograma");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Item do Cronograma</DialogTitle>
          <DialogDescription>{item.nome}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Data de Término</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Percentual Realizado (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
