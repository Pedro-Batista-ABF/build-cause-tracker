
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScheduleTask } from "@/types/schedule";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface EditScheduleItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScheduleTask;
  tasks: ScheduleTask[];
  onSave: () => void;
}

export function EditScheduleItemDialog({
  open,
  onOpenChange,
  item,
  tasks,
  onSave,
}: EditScheduleItemDialogProps) {
  const [startDate, setStartDate] = useState(item.data_inicio?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(item.data_termino?.split('T')[0] || '');
  const [progress, setProgress] = useState(item.percentual_real?.toString() || '0');
  const [predecessorId, setPredecessorId] = useState(item.predecessor_id || 'none');
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Filter out the current task and its successors to avoid circular dependencies
  const availablePredecessors = tasks.filter(task => 
    task.id !== item.id && 
    task.nivel_hierarquia === item.nivel_hierarquia
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorDetails(null);

    try {
      // Log authentication status
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth session:", session ? "Active" : "Not active");

      // Prepare the update data with proper handling of null values
      const updateData = {
        data_inicio: startDate || null,
        data_termino: endDate || null,
        percentual_real: progress ? parseFloat(progress) : 0,
        predecessor_id: predecessorId === 'none' ? null : predecessorId,
      };
      
      console.log("Updating item with data:", updateData);
      console.log("Item ID:", item.id);

      // Perform the update
      const { data, error } = await supabase
        .from('cronograma_projeto')
        .update(updateData)
        .eq('id', item.id)
        .select();

      if (error) {
        console.error('Error details:', error);
        setErrorDetails(`${error.code}: ${error.message}`);
        throw error;
      }

      console.log("Update successful, response:", data);
      toast.success('Item atualizado com sucesso');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating schedule item:', error);
      toast.error(`Erro ao atualizar item: ${errorDetails || error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar {item.nome}</DialogTitle>
          <DialogDescription>
            Atualizar informações da subatividade no cronograma
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorDetails && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              <p className="font-medium">Erro detalhado:</p>
              <p className="mt-1">{errorDetails}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={predecessorId !== 'none'}
            />
            {predecessorId !== 'none' && (
              <p className="text-xs text-muted-foreground">
                A data de início é controlada pelo término da atividade predecessora
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data de Término</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">Percentual Real (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="predecessor" className="flex items-center gap-2">
              Atividade Predecessora
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Ao definir uma predecessora, a data de início desta tarefa 
                      será automaticamente ajustada quando a data de término da 
                      predecessora for alterada.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={predecessorId} onValueChange={setPredecessorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a predecessora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem predecessor</SelectItem>
                {availablePredecessors.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.wbs} - {task.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Datas da Linha de Base</Label>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-md">
              <div>
                <Label className="text-sm text-muted-foreground">Início Base</Label>
                <div className="font-medium">
                  {item.inicio_linha_base 
                    ? new Date(item.inicio_linha_base).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Término Base</Label>
                <div className="font-medium">
                  {item.termino_linha_base
                    ? new Date(item.termino_linha_base).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
