
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getScheduleStatus } from "@/utils/ppcCalculation";
import { LinkTaskDialog } from "./LinkTaskDialog";
import { GanttChart } from "./GanttChart";
import { supabase } from "@/integrations/supabase/client";
import { Link, Edit } from "lucide-react";
import { ScheduleTask, LinkedActivity } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { EditScheduleItemDialog } from "./EditScheduleItemDialog";

interface ScheduleGanttProps {
  scheduleData: ScheduleTask[];
  isLoading: boolean;
  projectId: string;
  onDataChange: () => void;
}

export function ScheduleGantt({ scheduleData, isLoading, projectId, onDataChange }: ScheduleGanttProps) {
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [linkedActivities, setLinkedActivities] = useState<Record<string, string[]>>({});
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Fetch linked activities info
    async function fetchLinkedActivities() {
      try {
        const { data, error } = await supabase
          .from('cronograma_projeto')
          .select(`
            id,
            atividade_lps_id,
            activities (
              id, 
              name
            )
          `)
          .eq('projeto_id', projectId)
          .not('atividade_lps_id', 'is', null);
        
        if (error) throw error;

        // Modified to support multiple activities per task
        const linkMap: Record<string, string[]> = {};
        const typedData = data as LinkedActivity[];
        
        typedData.forEach((item) => {
          if (item.atividade_lps_id && item.activities) {
            if (!linkMap[item.id]) {
              linkMap[item.id] = [];
            }
            linkMap[item.id].push(item.activities.name);
          }
        });
        
        setLinkedActivities(linkMap);
      } catch (error) {
        console.error("Error fetching linked activities:", error);
      }
    }

    fetchLinkedActivities();
  }, [projectId, scheduleData]);

  const handleLinkTask = (task: ScheduleTask) => {
    setSelectedTask(task);
    setIsLinkDialogOpen(true);
  };

  const handleLinkSuccess = (taskId: string, activityName: string) => {
    if (activityName) {
      // Update the linked activities state to reflect the new link
      setLinkedActivities(prev => {
        const updated = { ...prev };
        if (!updated[taskId]) {
          updated[taskId] = [];
        }
        if (!updated[taskId].includes(activityName)) {
          updated[taskId] = [...updated[taskId], activityName];
        }
        return updated;
      });
    } else {
      // If activityName is empty, the link was removed
      setLinkedActivities(prev => {
        const updated = { ...prev };
        if (updated[taskId]) {
          delete updated[taskId];
        }
        return updated;
      });
    }
    onDataChange();
  };

  const filteredData = scheduleData.filter((task) => {
    if (filter === "all") return true;
    if (filter === "linked") return !!linkedActivities[task.id];
    if (filter === "unlinked") return !linkedActivities[task.id];
    
    const status = getScheduleStatus(task.percentual_real - task.percentual_previsto);
    return status === filter;
  });

  const getStatusColor = (task: ScheduleTask) => {
    const variance = task.percentual_real - task.percentual_previsto;
    if (task.percentual_real === 100) return 'bg-accent-green';
    if (variance < -10) return 'bg-accent-red';
    if (variance < 0) return 'bg-accent-purple';
    return 'bg-accent-blue';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleEditTask = (task: ScheduleTask) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cronograma do Projeto</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter">Filtrar por:</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tarefas</SelectItem>
              <SelectItem value="linked">Tarefas vinculadas</SelectItem>
              <SelectItem value="unlinked">Tarefas não vinculadas</SelectItem>
              <SelectItem value="atrasado">Atrasadas</SelectItem>
              <SelectItem value="atenção">Em atenção</SelectItem>
              <SelectItem value="no prazo">No prazo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={ganttContainerRef} className="gantt-container overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[0.4fr_1fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.4fr] text-sm font-medium px-4 py-2 border-b bg-muted/40">
              <div className="text-muted-foreground">WBS</div>
              <div className="text-muted-foreground">Tarefa</div>
              <div className="text-muted-foreground">Início</div>
              <div className="text-muted-foreground">Término</div>
              <div className="text-muted-foreground">Início Base</div>
              <div className="text-muted-foreground">Término Base</div>
              <div className="text-muted-foreground">% Previsto</div>
              <div className="text-muted-foreground">% Real</div>
              <div className="text-muted-foreground">Predecessor</div>
              <div className="text-muted-foreground">Ações</div>
            </div>

            {filteredData.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma tarefa encontrada com os filtros selecionados
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {filteredData.map((task) => {
                  const paddingLeft = task.nivel_hierarquia * 16;
                  // Update to consistently use predecessores field
                  const predecessorId = task.predecessores;
                  const predecessorTask = predecessorId 
                    ? scheduleData.find(t => t.id === predecessorId || t.tarefa_id === predecessorId)
                    : null;

                  return (
                    <div 
                      key={task.id} 
                      className={cn(
                        "grid grid-cols-[0.4fr_1fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.4fr] items-center px-4 py-2",
                        "hover:bg-accent/5 rounded-sm transition-colors",
                        "text-sm",
                        task.nivel_hierarquia === 0 && "font-medium"
                      )}
                    >
                      <div className="text-muted-foreground">{task.wbs}</div>
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${paddingLeft}px` }}>
                        <span className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(task))}></span>
                        <span className="font-medium">{task.nome}</span>
                        <div className="flex flex-wrap gap-1 ml-2">
                          {linkedActivities[task.id]?.map((activityName, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs bg-accent/10 text-accent-foreground"
                            >
                              {activityName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        {task.data_inicio ? new Date(task.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <div className="text-muted-foreground">
                        {task.data_termino ? new Date(task.data_termino).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <div className="text-muted-foreground">
                        {task.inicio_linha_base ? new Date(task.inicio_linha_base).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <div className="text-muted-foreground">
                        {task.termino_linha_base ? new Date(task.termino_linha_base).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <div className="text-muted-foreground font-medium">
                        {task.percentual_previsto || 0}%
                      </div>
                      <div className="text-muted-foreground font-medium">
                        {task.percentual_real || 0}%
                      </div>
                      <div className="text-muted-foreground">
                        {predecessorTask ? `${predecessorTask.wbs} - ${predecessorTask.nome}` : 'N/A'}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-accent/10" 
                          onClick={() => handleLinkTask(task)}
                          title="Vincular à atividade LPS"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-accent/10"
                          onClick={() => handleEditTask(task)}
                          title="Editar item"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Gantt Chart with S-curve */}
        <GanttChart 
          tasks={filteredData}
          showSCurve={true}
        />
      </CardContent>

      {selectedTask && (
        <>
          <LinkTaskDialog
            open={isLinkDialogOpen}
            onOpenChange={setIsLinkDialogOpen}
            task={selectedTask}
            projectId={projectId}
            currentActivityId={selectedTask.atividade_lps_id || undefined}
            onLinkSuccess={handleLinkSuccess}
          />
          <EditScheduleItemDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            item={selectedTask}
            tasks={scheduleData}
            onSave={onDataChange}
          />
        </>
      )}
    </Card>
  );
}
