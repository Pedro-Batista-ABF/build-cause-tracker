
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
import { Link } from "lucide-react";
import { ScheduleTask, LinkedActivity } from "@/types/schedule";

interface ScheduleGanttProps {
  scheduleData: ScheduleTask[];
  isLoading: boolean;
  projectId: string;
  onDataChange: () => void;
}

export function ScheduleGantt({ scheduleData, isLoading, projectId, onDataChange }: ScheduleGanttProps) {
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
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
    const status = getScheduleStatus(variance);
    
    switch(status) {
      case 'atrasado': return 'bg-red-500';
      case 'atenção': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
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
          <div className="min-w-full">
            <div className="grid grid-cols-[0.5fr_1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.5fr] font-medium text-sm px-4 py-2 border-b">
              <div>WBS</div>
              <div>Tarefa</div>
              <div>Início</div>
              <div>Término</div>
              <div>% Previsto</div>
              <div>% Real</div>
              <div>Ações</div>
            </div>

            {filteredData.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                Nenhuma tarefa encontrada com os filtros selecionados
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {filteredData.map((task) => {
                  const paddingLeft = task.nivel_hierarquia * 16;
                  return (
                    <div 
                      key={task.id} 
                      className="grid grid-cols-[0.5fr_1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.5fr] items-center px-4 py-2 hover:bg-muted/50 rounded-sm text-sm"
                    >
                      <div>{task.wbs}</div>
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${paddingLeft}px` }}>
                        <span className={`h-3 w-3 rounded-full ${getStatusColor(task)}`}></span>
                        <span className="font-medium">{task.nome}</span>
                        <div className="flex flex-wrap gap-1 ml-2">
                          {linkedActivities[task.id]?.map((activityName, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {activityName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>{task.data_inicio ? new Date(task.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}</div>
                      <div>{task.data_termino ? new Date(task.data_termino).toLocaleDateString('pt-BR') : 'N/A'}</div>
                      <div>{task.percentual_previsto || 0}%</div>
                      <div>{task.percentual_real || 0}%</div>
                      <div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleLinkTask(task)}
                          title="Vincular à atividade LPS"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Adicionando o gráfico de Gantt */}
        <GanttChart tasks={filteredData} />
      </CardContent>

      {selectedTask && (
        <LinkTaskDialog
          open={isLinkDialogOpen}
          onOpenChange={setIsLinkDialogOpen}
          task={selectedTask}
          projectId={projectId}
          currentActivityId={selectedTask.atividade_lps_id || undefined}
          onLinkSuccess={handleLinkSuccess}
        />
      )}
    </Card>
  );
}
