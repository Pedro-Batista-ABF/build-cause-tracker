import { useState, useEffect } from "react";
import { ActivityRow } from "@/components/activities/ActivityRow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export default function Activities() {
  const [activities, setActivities] = useState<Tables<'activities'>[]>([]);
  const [filter, setFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*');

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        toast.error('Não foi possível carregar as atividades');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const filteredActivities = activities.filter((activity) => {
    const matchesFilter =
      activity.name.toLowerCase().includes(filter.toLowerCase()) ||
      (activity.manager || '').toLowerCase().includes(filter.toLowerCase()) ||
      (activity.responsible || '').toLowerCase().includes(filter.toLowerCase());

    const matchesDiscipline =
      disciplineFilter === "all" || activity.discipline === disciplineFilter;

    return matchesFilter && matchesDiscipline;
  });

  const disciplines = Array.from(
    new Set(activities.map((activity) => activity.discipline).filter(Boolean))
  );

  if (loading) {
    return <div>Carregando atividades...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
        <Button asChild>
          <Link to="/activities/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Atividade
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Atividades</CardTitle>
          <CardDescription>
            Gerenciamento de atividades e apontamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atividades..."
                className="pl-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Select
              value={disciplineFilter}
              onValueChange={setDisciplineFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <ActivityRow 
                key={activity.id} 
                id={activity.id}
                name={activity.name}
                discipline={activity.discipline || ''}
                manager={activity.manager || ''}
                responsible={activity.responsible || ''}
                unit={activity.unit || ''}
                totalQty={activity.total_qty || 0}
                progress={0} // TODO: Implement progress calculation
                ppc={0} // TODO: Implement PPC calculation
                adherence={0} // TODO: Implement adherence calculation
              />
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma atividade encontrada com os filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
