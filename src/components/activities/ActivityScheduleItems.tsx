
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
import { PlusIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      toast.error('Erro ao carregar itens do cronograma');
    } finally {
      setLoading(false);
    }
  }

  async function addNewItem() {
    try {
      const newItem = {
        activity_id: activityId,
        name: 'Nova subatividade',
        order_index: items.length,
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

  if (loading) {
    return <div>Carregando itens do cronograma...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Itens do Cronograma</h3>
        <Button onClick={addNewItem} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Item
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
              <TableHead>% Concluído</TableHead>
              <TableHead>Predecessor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.start_date}</TableCell>
                <TableCell>{item.end_date}</TableCell>
                <TableCell>{item.duration_days}</TableCell>
                <TableCell>{item.percent_complete}%</TableCell>
                <TableCell>
                  {item.predecessor_item_id ? 
                    items.find(i => i.id === item.predecessor_item_id)?.name : 
                    'Nenhum'
                  }
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhum item no cronograma.
        </p>
      )}
    </div>
  );
}
