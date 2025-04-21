
import { useMemo } from "react";
import { ScheduleTask } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateDistribution } from "@/utils/progressDistribution";

interface GanttChartProps {
  tasks: ScheduleTask[];
  showSCurve?: boolean;
}

export function GanttChart({ tasks, showSCurve = false }: GanttChartProps) {
  const projectStart = useMemo(() => {
    const dates = tasks
      .map(task => [
        task.inicio_linha_base,
        task.data_inicio,
      ].filter(Boolean)) as string[];
    return dates.length > 0 ? new Date(Math.min(...dates.flat().map(d => new Date(d).getTime()))) : new Date();
  }, [tasks]);

  const projectEnd = useMemo(() => {
    const dates = tasks
      .map(task => [
        task.termino_linha_base,
        task.data_termino,
      ].filter(Boolean)) as string[];
    return dates.length > 0 ? new Date(Math.max(...dates.flat().map(d => new Date(d).getTime()))) : new Date();
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
    const delayed = task.percentual_real < (task.percentual_previsto || 0);

    if (completed) return 'bg-accent-green';
    if (notStarted) return 'bg-gray-300';
    if (delayed) return 'bg-accent-red';
    return 'bg-accent-blue';
  };

  const getTaskTooltip = (task: ScheduleTask) => {
    const predecessor = tasks.find(t => t.id === task.predecessor_id);
    return `${task.nome}
Previsto: ${task.percentual_previsto || 0}%
Realizado: ${task.percentual_real || 0}%
Início Base: ${task.inicio_linha_base ? new Date(task.inicio_linha_base).toLocaleDateString('pt-BR') : 'N/A'}
Término Base: ${task.termino_linha_base ? new Date(task.termino_linha_base).toLocaleDateString('pt-BR') : 'N/A'}
Início Atual: ${task.data_inicio ? new Date(task.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}
Término Atual: ${task.data_termino ? new Date(task.data_termino).toLocaleDateString('pt-BR') : 'N/A'}
${predecessor ? `Predecessora: ${predecessor.nome}` : ''}`;
  };

  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
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
      <CardContent className="pt-6 overflow-x-auto">
        <div className="gantt-chart min-w-[800px]">
          <div className="flex border-b mb-4">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex-1 flex">
              {months.map((month, index) => (
                <div 
                  key={index}
                  className="flex-1 text-sm font-medium text-center text-muted-foreground"
                >
                  {month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={cn(
                  "flex items-center min-h-[2rem] group hover:bg-accent/5 rounded-sm transition-colors",
                  task.nivel_hierarquia === 0 && "font-medium"
                )}
              >
                <div 
                  className="w-64 flex-shrink-0 truncate pr-4 text-sm group-hover:text-accent-foreground transition-colors"
                  style={{ paddingLeft: `${task.nivel_hierarquia * 16}px` }}
                >
                  {task.nome}
                </div>
                <div className="flex-1 relative h-6">
                  {/* Baseline bar */}
                  {task.inicio_linha_base && task.termino_linha_base && (
                    <div
                      className="absolute h-2 top-1 rounded bg-gray-200"
                      style={{
                        left: `${getTaskPosition(task.inicio_linha_base, projectStart, projectEnd)}%`,
                        width: `${getTaskBarWidth(task.inicio_linha_base, task.termino_linha_base, projectStart, projectEnd)}%`
                      }}
                    />
                  )}
                  
                  {/* Current progress bar */}
                  {task.data_inicio && task.data_termino && (
                    <div
                      className={cn(
                        "absolute h-4 rounded shadow-sm transition-all",
                        "group-hover:ring-2 group-hover:ring-accent group-hover:ring-offset-1",
                        getTaskStatusColor(task)
                      )}
                      style={{
                        left: `${getTaskPosition(task.data_inicio, projectStart, projectEnd)}%`,
                        width: `${getTaskBarWidth(task.data_inicio, task.data_termino, projectStart, projectEnd)}%`
                      }}
                      title={getTaskTooltip(task)}
                    >
                      {task.percentual_real > 0 && task.percentual_real < 100 && (
                        <div
                          className="absolute inset-y-0 left-0 bg-accent-green rounded"
                          style={{ width: `${task.percentual_real}%` }}
                        />
                      )}
                    </div>
                  )}

                  {/* Draw dependency lines */}
                  {task.predecessor_id && (
                    <div
                      className="absolute h-6 border-l border-dashed border-accent/50"
                      style={{
                        left: `${getTaskPosition(
                          tasks.find(t => t.id === task.predecessor_id)?.data_termino || null,
                          projectStart,
                          projectEnd
                        )}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
