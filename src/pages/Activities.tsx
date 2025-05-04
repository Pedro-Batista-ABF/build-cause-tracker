
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityRow } from "@/components/activities/ActivityRow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsibleReportController } from "@/components/reports/ResponsibleReportController";
import { supabase } from "@/integrations/supabase/client";
import { calculatePPC } from "@/utils/ppcCalculation";
import { Activity } from "@/types/database";

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("filter") || "");
  const [disciplineFilter, setDisciplineFilter] = useState(searchParams.get("discipline") || "all");
  const [projectFilter, setProjectFilter] = useState(searchParams.get("project") || "all");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Use useCallback to memoize the fetchActivities function
  const fetchActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *, 
          daily_progress(actual_qty, planned_qty, date), 
          project_id, 
          start_date, 
          end_date, 
          schedule_percent_complete,
          schedule_start_date,
          schedule_end_date,
          schedule_duration_days,
          schedule_predecessor_id
        `)
        .order('start_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      // Process the activities to calculate progress, ppc, and adherence
      const processedActivities = data.map(activity => {
        const progressData = activity.daily_progress || [];
        const totalActual = progressData.reduce(
          (sum: number, p: any) => sum + (p.actual_qty || 0),
          0
        );
        const totalPlanned = progressData.reduce(
          (sum: number, p: any) => sum + (p.planned_qty || 0),
          0
        );
        
        // Use schedule_percent_complete if available, otherwise calculate based on quantity
        let progress;
        if (activity.schedule_percent_complete !== null && activity.schedule_percent_complete !== undefined) {
          progress = activity.schedule_percent_complete;
        } else {
          progress = activity.total_qty && Number(activity.total_qty) > 0
            ? Math.round((totalActual / Number(activity.total_qty)) * 100)
            : 0;
        }
          
        // Use the utility function for PPC calculation
        const ppc = calculatePPC(totalActual, totalPlanned);
        
        // Calculate adherence
        const adherence = totalPlanned ? Math.min(100, Math.round((totalActual / totalPlanned) * 100)) : 0;
        const saldoAExecutar = Number(activity.total_qty || 0) - totalActual;

        return {
          ...activity,
          progress,
          ppc,
          adherence,
          saldoAExecutar,
        };
      });

      setActivities(processedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchProjects();
  }, [fetchActivities, fetchProjects]);

  // Update search params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filter) newParams.set("filter", filter);
    if (disciplineFilter !== "all") newParams.set("discipline", disciplineFilter);
    if (projectFilter !== "all") newParams.set("project", projectFilter);
    setSearchParams(newParams, { replace: true });
  }, [filter, disciplineFilter, projectFilter, setSearchParams]);

  // Handle activity deletion by refreshing the activities list
  const handleActivityDeleted = () => {
    fetchActivities();
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const handleDisciplineChange = (value: string) => {
    setDisciplineFilter(value);
  };

  const handleProjectChange = (value: string) => {
    setProjectFilter(value);
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesFilter =
      activity.name.toLowerCase().includes(filter.toLowerCase()) ||
      (activity.responsible || '').toLowerCase().includes(filter.toLowerCase());

    const matchesDiscipline =
      disciplineFilter === "all" || activity.discipline === disciplineFilter;

    const matchesProject =
      projectFilter === "all" || activity.project_id === projectFilter;

    return matchesFilter && matchesDiscipline && matchesProject;
  });

  // Filter out null disciplines and ensure we have unique values
  const uniqueDisciplines = Array.from(
    new Set(activities.map(a => a.discipline).filter(Boolean))
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Atividades</h1>
        <div className="flex gap-2">
          <ResponsibleReportController />
          <Button onClick={() => {
            // Preserve current filters when creating a new activity
            navigate("/activities/new", { state: { returnTo: location.pathname + location.search } });
          }}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar Atividades</CardTitle>
          <CardDescription>
            Filtre as atividades por nome, responsável, disciplina ou projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome ou responsável..."
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipline">Disciplina</Label>
              <Select value={disciplineFilter} onValueChange={handleDisciplineChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {uniqueDisciplines.map((discipline) => (
                    <SelectItem key={discipline} value={discipline || ""}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Projeto</Label>
              <Select value={projectFilter} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Atividades</CardTitle>
          <CardDescription>
            Todas as atividades cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => {
                const {
                  id,
                  name,
                  discipline,
                  responsible,
                  team,
                  unit,
                  total_qty,
                  progress,
                  ppc,
                  adherence,
                  start_date,
                  end_date,
                  saldoAExecutar,
                  description,
                } = activity;

                return (
                  <ActivityRow
                    key={id}
                    id={id}
                    name={name}
                    discipline={discipline || ''}
                    responsible={responsible || ''}
                    team={team || ''}
                    unit={unit || ''}
                    totalQty={total_qty || 0}
                    progress={progress}
                    ppc={ppc}
                    adherence={adherence}
                    startDate={start_date}
                    endDate={end_date}
                    onEdit={(activityId) => navigate(`/activities/edit/${activityId}`, { 
                      state: { returnTo: location.pathname + location.search } 
                    })}
                    onDelete={handleActivityDeleted}
                    saldoAExecutar={saldoAExecutar}
                    description={description}
                  />
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade encontrada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
