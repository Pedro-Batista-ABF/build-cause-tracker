
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScheduleTask } from "@/types/schedule";

interface EditScheduleItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScheduleTask;
  onSave: () => void;
}

export function EditScheduleItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: EditScheduleItemDialogProps) {
  const [startDate, setStartDate] = useState(item.data_inicio?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(item.data_termino?.split('T')[0] || '');
  const [progress, setProgress] = useState(item.percentual_real?.toString() || '0');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('cronograma_projeto')
        .update({
          data_inicio: startDate || null,
          data_termino: endDate || null,
          percentual_real: progress ? parseFloat(progress) : 0,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item atualizado com sucesso');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating schedule item:', error);
      toast.error('Erro ao atualizar item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {item.nome}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
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
