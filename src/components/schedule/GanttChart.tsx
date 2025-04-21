
import { useMemo } from "react";
import { ScheduleTask } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateDistribution } from "@/utils/progressDistribution";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { getScheduleStatus } from "@/utils/ppcCalculation";

interface GanttChartProps {
  tasks: ScheduleTask[];
  showSCurve?: boolean;
}

export function GanttChart({ tasks, showSCurve = false }: GanttChartProps) {
  const projectStart = useMemo(() => {
    const dates = tasks
      .flatMap(task => [
        task.inicio_linha_base,
        task.data_inicio,
      ].filter(Boolean)) as string[];
    return dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : new Date();
  }, [tasks]);

  const projectEnd = useMemo(() => {
    const dates = tasks
      .flatMap(task => [
        task.termino_linha_base,
        task.data_termino,
      ].filter(Boolean)) as string[];
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : new Date();
  }, [tasks]);

  const getTaskPosition = (date: string | null, referenceStart: Date, referenceEnd: Date) => {
    if (!date) return 0;
    const currentDate = new Date(date);
    return ((currentDate.getTime() - referenceStart.getTime()) / 
            (referenceEnd.getTime() - referenceStart.getTime())) * 100;
  };

  const getTaskBarWidth = (startDate: string | null, endDate: string | null, referenceStart: Date, referenceEnd: Date) => {
    if (!startDate || !endDate) return 0;
    const start = getTaskPosition(startDate, referenceStart, referenceEnd);
    const end = getTaskPosition(endDate, referenceStart, referenceEnd);
    return end - start;
  };

  const getTaskStatusColor = (task: ScheduleTask) => {
    const completed = task.percentual_real === 100;
    const notStarted = !task.percentual_real || task.percentual_real === 0;
    const delayed = (task.percentual_real || 0) < (task.percentual_previsto || 0);

    if (completed) return 'bg-accent-green';
    if (notStarted) return 'bg-gray-300';
    if (delayed) return 'bg-accent-red';
    return 'bg-accent-blue';
  };

  const getTaskStatusBadge = (task: ScheduleTask) => {
    const completed = task.percentual_real === 100;
    const notStarted = !task.percentual_real || task.percentual_real === 0;
    const delayed = (task.percentual_real || 0) < (task.percentual_previsto || 0);

    if (completed) return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" /> Concluída
      </Badge>
    );
    
    if (notStarted) return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
        <Info className="h-3 w-3 mr-1" /> Não iniciada
      </Badge>
    );
    
    if (delayed) return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
        <AlertTriangle className="h-3 w-3 mr-1" /> Atrasada
      </Badge>
    );
    
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
        <CheckCircle className="h-3 w-3 mr-1" /> No prazo
      </Badge>
    );
  };

  const getTaskTooltip = (task: ScheduleTask) => {
    const predecessor = tasks.find(t => t.id === task.predecessor_id);
    const completedDays = task.percentual_real ? Math.round((task.percentual_real / 100) * (task.duracao_dias || 0)) : 0;
    const remainingDays = (task.duracao_dias || 0) - completedDays;
    
    return `${task.nome}
Previsto: ${task.percentual_previsto || 0}%
Realizado: ${task.percentual_real || 0}%
Duração: ${task.duracao_dias || 0} dias
Completo: ${completedDays} dias
Restante: ${remainingDays} dias
Início Base: ${task.inicio_linha_base ? new Date(task.inicio_linha_base).toLocaleDateString('pt-BR') : 'N/A'}
Término Base: ${task.termino_linha_base ? new Date(task.termino_linha_base).toLocaleDateString('pt-BR') : 'N/A'}
Início Atual: ${task.data_inicio ? new Date(task.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}
Término Atual: ${task.data_termino ? new Date(task.data_termino).toLocaleDateString('pt-BR') : 'N/A'}
${predecessor ? `Predecessora: ${predecessor.nome}` : ''}`;
  };

  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 14; // Add padding
  const monthsToShow = Math.ceil(totalDays / 30);

  const months = useMemo(() => {
    const months = [];
    const currentDate = new Date(projectStart);
    
    for (let i = 0; i < monthsToShow; i++) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }, [projectStart, monthsToShow]);

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-4 justify-end">
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 bg-gray-200 rounded"></div>
            <span className="text-sm text-muted-foreground">Linha de Base</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-8 bg-accent-blue rounded"></div>
            <span className="text-sm text-muted-foreground">No Prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-8 bg-accent-red rounded"></div>
            <span className="text-sm text-muted-foreground">Atrasado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-8 bg-accent-green rounded"></div>
            <span className="text-sm text-muted-foreground">Concluído</span>
          </div>
        </div>
        
        <div className="gantt-chart overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid bg-muted/20 border rounded-md">
              <div className="flex bg-muted/40 border-b p-2 sticky top-0 z-10">
                <div className="w-72 flex-shrink-0 px-4 font-medium">Atividade</div>
                <div className="flex-1 flex">
                  {months.map((month, index) => (
                    <div 
                      key={index}
                      className="flex-1 text-sm font-medium text-center"
                    >
                      {month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "flex min-h-[3rem] hover:bg-accent/5 transition-colors border-b last:border-b-0",
                      task.nivel_hierarquia === 0 && "bg-muted/10 font-medium"
                    )}
                  >
                    <div 
                      className="w-72 flex-shrink-0 flex items-center gap-2 px-4 py-2"
                      style={{ paddingLeft: `${(task.nivel_hierarquia || 0) * 16 + 16}px` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{task.nome}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getTaskStatusBadge(task)}
                          {task.duracao_dias && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {task.duracao_dias} dias
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative py-2 bg-[url('/lovable-uploads/3f34b50e-416c-4bd3-850d-e8bae9ab8645.png')] bg-grid-slate-100">
                      {/* Grid lines for months */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {months.map((_, index) => (
                          <div key={index} className="flex-1 border-r last:border-r-0 border-slate-200"></div>
                        ))}
                      </div>
                      
                      {/* Baseline bar */}
                      {task.inicio_linha_base && task.termino_linha_base && (
                        <div
                          className="absolute h-3 rounded-sm bg-gray-200 border border-gray-300 z-10"
                          style={{
                            top: '50%',
                            marginTop: '-6px',
                            left: `${getTaskPosition(task.inicio_linha_base, projectStart, projectEnd)}%`,
                            width: `${getTaskBarWidth(task.inicio_linha_base, task.termino_linha_base, projectStart, projectEnd)}%`
                          }}
                        />
                      )}
                      
                      {/* Current progress bar */}
                      {task.data_inicio && task.data_termino && (
                        <div
                          className={cn(
                            "absolute h-6 rounded-sm shadow-sm transition-all z-20",
                            "hover:shadow-md hover:translate-y-[-1px] group",
                            getTaskStatusColor(task)
                          )}
                          style={{
                            top: '50%',
                            marginTop: '-12px',
                            left: `${getTaskPosition(task.data_inicio, projectStart, projectEnd)}%`,
                            width: `${getTaskBarWidth(task.data_inicio, task.data_termino, projectStart, projectEnd)}%`,
                            minWidth: '10px'
                          }}
                          title={getTaskTooltip(task)}
                        >
                          {task.percentual_real && task.percentual_real > 0 && (
                            <div
                              className="absolute inset-y-0 left-0 bg-accent-green/50 rounded-l-sm border-r border-white/30"
                              style={{ 
                                width: `${task.percentual_real}%`,
                                maxWidth: '100%'
                              }}
                            />
                          )}
                          <div className="absolute inset-0 px-2 flex items-center overflow-hidden whitespace-nowrap text-xs font-medium text-white">
                            {task.nome} ({task.percentual_real || 0}%)
                          </div>
                        </div>
                      )}

                      {/* Draw dependency arrows */}
                      {task.predecessor_id && (
                        <div className="absolute top-0 bottom-0 flex items-center z-10">
                          <div
                            className="absolute h-6 border-l-2 border-b-2 border-accent/60 border-dashed rounded-bl-lg"
                            style={{
                              left: `${getTaskPosition(
                                tasks.find(t => t.id === task.predecessor_id)?.data_termino || null,
                                projectStart,
                                projectEnd
                              )}%`,
                              width: `${Math.max(
                                getTaskPosition(task.data_inicio || '', projectStart, projectEnd) - 
                                getTaskPosition(
                                  tasks.find(t => t.id === task.predecessor_id)?.data_termino || '',
                                  projectStart,
                                  projectEnd
                                ),
                                0
                              )}%`,
                              minWidth: '10px',
                              height: '16px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
