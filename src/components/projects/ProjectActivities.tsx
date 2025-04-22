
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityRow } from "@/components/activities/ActivityRow";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsibleReportController } from "@/components/reports/ResponsibleReportController";
import { DistributionType } from "@/utils/progressDistribution";

interface Activity {
  id: string;
  name: string;
  discipline: string | null;
  responsible: string | null;
  team: string | null;
  unit: string | null;
  total_qty: number | null;
  progress: number;
  ppc: number;
  adherence: number;
  start_date?: string;
  end_date?: string;
  distribution_type?: DistributionType;
}

interface ProjectActivitiesProps {
  projectId: string;
}

export function ProjectActivities({ projectId }: ProjectActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  async function fetchActivities() {
    try {
      const { data: activitiesData, error } = await supabase
        .from("activities")
        .select("*, daily_progress(actual_qty, planned_qty)")
        .eq("project_id", projectId);

      if (error) throw error;

      // Also fetch activity planning data from activity_planning table
      const { data: planningData, error: planningError } = await supabase
        .from("activity_planning")
        .select("*")
        .eq("project_id", projectId);

      if (planningError) {
        console.error("Error fetching planning data:", planningError);
      }

      // Create a map for quick lookup of planning data
      const planningMap = new Map();
      if (planningData) {
        planningData.forEach((plan) => {
          planningMap.set(plan.activity_id, plan);
        });
      }

      const processedActivities = activitiesData.map(activity => {
        const progressData = activity.daily_progress || [];
        const totalActual = progressData.reduce((sum: number, p: any) => sum + (p.actual_qty || 0), 0);
        const totalPlanned = progressData.reduce((sum: number, p: any) => sum + (p.planned_qty || 0), 0);
        
        const progress = activity.total_qty ? (totalActual / activity.total_qty) * 100 : 0;
        const ppc = totalPlanned ? (totalActual / totalPlanned) * 100 : 0;
        const adherence = totalPlanned ? Math.min(100, (totalActual / totalPlanned) * 100) : 0;

        // Get planning data for this activity
        const planning = planningMap.get(activity.id);

        return {
          ...activity,
          progress: Math.round(progress),
          ppc: Math.round(ppc),
          adherence: Math.round(adherence),
          team: activity.team || "",
          start_date: planning?.start_date,
          end_date: planning?.end_date,
          distribution_type: planning?.distribution_type as DistributionType || "Linear"
        };
      });

      setActivities(processedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = filter === "" ||
      activity.name.toLowerCase().includes(filter.toLowerCase()) ||
      activity.responsible?.toLowerCase().includes(filter.toLowerCase());

    const matchesDiscipline = disciplineFilter === "all" ||
      activity.discipline === disciplineFilter;

    return matchesSearch && matchesDiscipline;
  });

  // Filter out null disciplines and ensure we have unique, non-empty values
  const uniqueDisciplines = Array.from(
    new Set(activities.map(a => a.discipline).filter(Boolean))
  );

  if (loading) {
    return <p>Carregando atividades...</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Atividades do Projeto</CardTitle>
        <ResponsibleReportController projectId={projectId} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome, responsável ou equipe..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipline">Disciplina</Label>
              <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {uniqueDisciplines.map((discipline) => (
                    <SelectItem key={discipline} value={discipline || "não especificada"}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <ActivityRow 
                  key={activity.id}
                  id={activity.id}
                  name={activity.name}
                  discipline={activity.discipline || ''}
                  responsible={activity.responsible || ''}
                  team={activity.team || ''}
                  unit={activity.unit || ''}
                  totalQty={activity.total_qty || 0}
                  progress={activity.progress}
                  ppc={activity.ppc}
                  adherence={activity.adherence}
                  startDate={activity.start_date}
                  endDate={activity.end_date}
                  distributionType={activity.distribution_type}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma atividade encontrada.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
