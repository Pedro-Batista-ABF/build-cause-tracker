
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Edit2Icon, Trash2Icon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalDate } from "@/utils/dateUtils";
import { useQueryClient } from "@tanstack/react-query";

interface ActivityScheduleItem {
  id: string;
  activity_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  predecessor_item_id: string | null;
  percent_complete: number;
  order_index: number;
}

interface ActivityScheduleItemsProps {
  activityId: string;
}

export function ActivityScheduleItems({ activityId }: ActivityScheduleItemsProps) {
  const [items, setItems] = useState<ActivityScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ActivityScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    percent_complete: 0
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchScheduleItems();
  }, [activityId]);

  async function fetchScheduleItems() {
    try {
      const { data, error } = await supabase
        .from('activity_schedule_items')
        .select('*')
        .eq('activity_id', activityId)
        .order('order_index');

      if (error) throw error;
      setItems(data || []);
      
      // Após carregar os itens, atualizar o progresso da atividade principal
      if (data && data.length > 0) {
        updateActivityProgress(data);
      }
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      toast.error('Erro ao carregar itens do cronograma');
    } finally {
      setLoading(false);
    }
  }

  // Função para calcular e atualizar o progresso da atividade principal baseado nas subatividades
  async function updateActivityProgress(scheduleItems: ActivityScheduleItem[]) {
    try {
      if (scheduleItems.length === 0) return;
      
      // Calcula a média dos percentuais completos
      const totalPercent = scheduleItems.reduce((sum, item) => sum + (item.percent_complete || 0), 0);
      const averagePercent = totalPercent / scheduleItems.length;
      
      // Atualiza a atividade principal
      const { error } = await supabase
        .from('activities')
        .update({ 
          schedule_percent_complete: averagePercent 
        })
        .eq('id', activityId);
        
      if (error) throw error;
      
      // Invalida cache de queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch (error) {
      console.error('Error updating activity progress:', error);
    }
  }

  async function addNewItem() {
    try {
      const newItem = {
        activity_id: activityId,
        name: 'Nova subatividade',
        order_index: items.length,
        percent_complete: 0
      };

      const { error } = await supabase
        .from('activity_schedule_items')
        .insert(newItem);

      if (error) throw error;

      toast.success('Item adicionado com sucesso');
      fetchScheduleItems();
    } catch (error) {
      console.error('Error adding schedule item:', error);
      toast.error('Erro ao adicionar item');
    }
  }
  
  function openEditDialog(item: ActivityScheduleItem) {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      percent_complete: item.percent_complete
    });
    setEditDialogOpen(true);
  }
  
  function openDeleteDialog(item: ActivityScheduleItem) {
    setCurrentItem(item);
    setDeleteDialogOpen(true);
  }
  
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'percent_complete' ? Number(value) : value
    });
  }
  
  async function saveItem() {
    if (!currentItem) return;
    
    try {
      // Calcular duração em dias se as datas estiverem definidas
      let durationDays = null;
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      const { error } = await supabase
        .from('activity_schedule_items')
        .update({
          name: formData.name,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          duration_days: durationDays,
          percent_complete: formData.percent_complete
        })
        .eq('id', currentItem.id);
        
      if (error) throw error;
      
      toast.success('Item atualizado com sucesso');
      setEditDialogOpen(false);
      fetchScheduleItems();
    } catch (error) {
      console.error('Error updating schedule item:', error);
      toast.error('Erro ao atualizar item');
    }
  }
  
  async function deleteItem() {
    if (!currentItem) return;
    
    try {
      const { error } = await supabase
        .from('activity_schedule_items')
        .delete()
        .eq('id', currentItem.id);
        
      if (error) throw error;
      
      toast.success('Item excluído com sucesso');
      setDeleteDialogOpen(false);
      fetchScheduleItems();
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      toast.error('Erro ao excluir item');
    }
  }
  
  // Calcular percentual previsto baseado na data atual
  function calculateExpectedPercent(start: string | null, end: string | null): number {
    if (!start || !end) return 0;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = today.getTime() - startDate.getTime();
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  }

  if (loading) {
    return <div>Carregando itens do cronograma...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Itens do Cronograma</h3>
        <Button onClick={addNewItem} size="sm" className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Subatividade
        </Button>
      </div>

      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Duração (dias)</TableHead>
              <TableHead>% Previsto</TableHead>
              <TableHead>% Concluído</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const expectedPercent = calculateExpectedPercent(item.start_date, item.end_date);
              
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.start_date ? formatLocalDate(item.start_date) : "N/D"}</TableCell>
                  <TableCell>{item.end_date ? formatLocalDate(item.end_date) : "N/D"}</TableCell>
                  <TableCell>{item.duration_days || "N/D"}</TableCell>
                  <TableCell>{item.start_date && item.end_date ? `${expectedPercent}%` : "N/D"}</TableCell>
                  <TableCell>{item.percent_complete}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDeleteDialog(item)}
                      >
                        <Trash2Icon className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhum item no cronograma. Adicione subatividades para começar.
        </p>
      )}
      
      {/* Diálogo de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Subatividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="percent_complete">% Concluído</Label>
              <Input
                id="percent_complete"
                name="percent_complete"
                type="number"
                min="0"
                max="100"
                value={formData.percent_complete}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Subatividade</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir a subatividade "{currentItem?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteItem}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
