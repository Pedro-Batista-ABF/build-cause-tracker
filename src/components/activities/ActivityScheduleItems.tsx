
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
import { PlusIcon, Edit2Icon, Trash2Icon, AlertCircleIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalDate } from "@/utils/dateUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityScheduleItem } from "@/types/schedule";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
    percent_complete: 0,
    predecessor_item_id: "none"
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activityId) {
      fetchScheduleItems();
    }
  }, [activityId]);
  
  // Effect for updating end dates of dependent items
  useEffect(() => {
    if (items.length > 0) {
      updateDependentDates();
    }
  }, [items]);

  async function fetchScheduleItems() {
    try {
      setLoading(true);
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

      const { data, error } = await supabase
        .from('activity_schedule_items')
        .insert(newItem)
        .select('*')
        .single();

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
      percent_complete: item.percent_complete,
      predecessor_item_id: item.predecessor_item_id || "none"
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
        durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      // Ajuste para garantir que predecessor_item_id seja null quando "none" é selecionado
      const predecessorId = formData.predecessor_item_id === "none" ? null : formData.predecessor_item_id;
      
      const { error } = await supabase
        .from('activity_schedule_items')
        .update({
          name: formData.name,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          duration_days: durationDays,
          predecessor_item_id: predecessorId,
          percent_complete: formData.percent_complete
        })
        .eq('id', currentItem.id);
        
      if (error) throw error;
      
      toast.success('Item atualizado com sucesso');
      setEditDialogOpen(false);
      await fetchScheduleItems();
    } catch (error) {
      console.error('Error updating schedule item:', error);
      toast.error('Erro ao atualizar item');
    }
  }
  
  async function deleteItem() {
    if (!currentItem) return;
    
    try {
      // Primeiro precisamos verificar se há algum item que depende deste
      const { data: dependentItems } = await supabase
        .from('activity_schedule_items')
        .select('id, name')
        .eq('predecessor_item_id', currentItem.id);
        
      if (dependentItems && dependentItems.length > 0) {
        // Existem itens dependentes, remova as dependências primeiro
        const dependentNames = dependentItems.map(item => item.name).join(', ');
        toast.error(`Não é possível excluir. Este item é predecessor de: ${dependentNames}`);
        setDeleteDialogOpen(false);
        return;
      }
      
      // Se não houver dependentes, pode excluir
      const { error } = await supabase
        .from('activity_schedule_items')
        .delete()
        .eq('id', currentItem.id);
        
      if (error) throw error;
      
      toast.success('Item excluído com sucesso');
      setDeleteDialogOpen(false);
      await fetchScheduleItems();
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      toast.error('Erro ao excluir item');
    }
  }
  
  // Função para atualizar datas dos itens dependentes
  async function updateDependentDates() {
    // Cria um mapa de itens por ID para fácil acesso
    const itemMap = new Map<string, ActivityScheduleItem>();
    items.forEach(item => {
      if (item.id) {
        itemMap.set(item.id, item);
      }
    });
    
    let hasUpdates = false;
    const updates: { id: string, start_date: string, end_date: string | null, duration_days: number | null }[] = [];
    
    // Para cada item com predecessor, ajustar data de início
    for (const item of items) {
      if (item.predecessor_item_id) {
        const predecessor = itemMap.get(item.predecessor_item_id);
        
        if (predecessor && predecessor.end_date) {
          // Predecessor encontrado, ajustar data inicial para ser o próximo dia após o término do predecessor
          const predecessorEndDate = new Date(predecessor.end_date);
          const nextDay = new Date(predecessorEndDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          // Formato YYYY-MM-DD para o Supabase
          const newStartDate = nextDay.toISOString().split('T')[0];
          
          // Somente se a data for diferente da atual
          if (!item.start_date || newStartDate !== item.start_date) {
            // Calcular nova data de término baseada na duração, se disponível
            let newEndDate = null;
            let durationDays = null;
            
            if (item.duration_days) {
              // Mantém a mesma duração, mas ajusta a data de término
              const endDate = new Date(nextDay);
              endDate.setDate(endDate.getDate() + (item.duration_days - 1));
              newEndDate = endDate.toISOString().split('T')[0];
              durationDays = item.duration_days;
            } else if (item.end_date) {
              // Se não tem duração mas tem data de término, recalcular
              const oldStartDate = new Date(item.start_date || "");
              const oldEndDate = new Date(item.end_date);
              const oldDuration = Math.ceil((oldEndDate.getTime() - oldStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              const endDate = new Date(nextDay);
              endDate.setDate(endDate.getDate() + (oldDuration - 1));
              newEndDate = endDate.toISOString().split('T')[0];
              durationDays = oldDuration;
            }
            
            if (item.id) {
              hasUpdates = true;
              updates.push({
                id: item.id,
                start_date: newStartDate,
                end_date: newEndDate,
                duration_days: durationDays
              });
            }
          }
        }
      }
    }
    
    // Atualizar itens que precisam ser atualizados
    if (hasUpdates) {
      try {
        for (const update of updates) {
          await supabase
            .from('activity_schedule_items')
            .update({
              start_date: update.start_date,
              end_date: update.end_date,
              duration_days: update.duration_days
            })
            .eq('id', update.id);
        }
        
        // Recarregar itens para refletir alterações
        toast.success('Datas das subatividades dependentes foram atualizadas');
        fetchScheduleItems();
      } catch (error) {
        console.error('Error updating dependent dates:', error);
        toast.error('Erro ao atualizar datas dependentes');
      }
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

  // Função para obter o nome de um item predecessor
  function getPredecessorName(predecessorId: string | null): string {
    if (!predecessorId) return "Nenhum";
    const predecessor = items.find(item => item.id === predecessorId);
    return predecessor ? predecessor.name : "Não encontrado";
  }
  
  // Verificar se há erro de ciclo de dependência
  function checkForCyclicDependency(itemId: string, predecessorId: string): boolean {
    // Verificar se o item está tentando usar a si mesmo como predecessor
    if (itemId === predecessorId) return true;
    
    // Construir mapa de dependências
    const dependencyMap = new Map<string, string>();
    items.forEach(item => {
      if (item.predecessor_item_id) {
        dependencyMap.set(item.id, item.predecessor_item_id);
      }
    });
    
    // Temporariamente adicionar a nova dependência para verificação
    dependencyMap.set(itemId, predecessorId);
    
    // Procurar por ciclo a partir do predecessor
    let current = predecessorId;
    const visited = new Set<string>();
    
    while (current) {
      // Se já visitamos este item, é um ciclo
      if (visited.has(current)) return true;
      visited.add(current);
      
      // Avançar para o próximo predecessor
      current = dependencyMap.get(current) || '';
      
      // Se chegarmos a um item sem predecessor, não há ciclo
      if (!current) break;
    }
    
    return false;
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Duração (dias)</TableHead>
                <TableHead>Predecessor</TableHead>
                <TableHead>% Previsto</TableHead>
                <TableHead>% Concluído</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const expectedPercent = calculateExpectedPercent(item.start_date, item.end_date);
                const isPredecessorDriven = !!item.predecessor_item_id;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      {item.start_date ? (
                        <div className="flex items-center gap-1">
                          {formatLocalDate(item.start_date)}
                          {isPredecessorDriven && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="h-5 px-1">
                                    <AlertCircleIcon className="h-3 w-3 text-amber-500" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Esta data é automaticamente ajustada com base no predecessor</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ) : (
                        "N/D"
                      )}
                    </TableCell>
                    <TableCell>{item.end_date ? formatLocalDate(item.end_date) : "N/D"}</TableCell>
                    <TableCell>{item.duration_days || "N/D"}</TableCell>
                    <TableCell>
                      {item.predecessor_item_id ? getPredecessorName(item.predecessor_item_id) : "Nenhum"}
                    </TableCell>
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
        </div>
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
            <DialogDescription>
              Atualize os detalhes desta subatividade no cronograma
            </DialogDescription>
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
                  disabled={!!formData.predecessor_item_id && formData.predecessor_item_id !== "none"}
                />
                {formData.predecessor_item_id && formData.predecessor_item_id !== "none" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    A data de início é controlada pelo predecessor
                  </p>
                )}
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
              <Label htmlFor="predecessor">Atividade Predecessora</Label>
              <Select
                value={formData.predecessor_item_id || "none"}
                onValueChange={(value) => setFormData({...formData, predecessor_item_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o predecessor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum predecessor</SelectItem>
                  {items
                    .filter(i => i.id !== currentItem?.id) // Evitar selecionar a si mesmo
                    .map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        disabled={currentItem ? checkForCyclicDependency(currentItem.id, item.id) : false}
                      >
                        {item.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              {formData.predecessor_item_id && formData.predecessor_item_id !== "none" && (
                <p className="text-xs text-amber-500 mt-1">
                  Ao definir um predecessor, a data de início será automaticamente ajustada.
                </p>
              )}
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
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
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
