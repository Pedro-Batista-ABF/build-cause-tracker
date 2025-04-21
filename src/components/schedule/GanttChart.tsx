import { useMemo } from "react";
import { ScheduleTask } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    const delayed = task.percentual_real < (task.percentual_previsto || 0);

    if (completed) return 'bg-green-500/90';
    if (notStarted) return 'bg-gray-400/80';
    if (delayed) return 'bg-red-500/90';
    return 'bg-blue-500/90';
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
        <div className="gantt-chart min-w-[800px] relative">
          {/* Month Headers */}
          <div className="relative grid border-b border-border-subtle" 
               style={{ gridTemplateColumns: `repeat(${monthsToShow}, 1fr)` }}>
            {months.map((month, index) => (
              <div 
                key={index}
                className="text-sm font-medium text-center py-2 border-r border-border-subtle last:border-r-0"
              >
                {month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </div>
            ))}
          </div>

          {/* Grid Background */}
          <div className="absolute inset-0 top-10 grid" 
               style={{ gridTemplateColumns: `repeat(${monthsToShow}, 1fr)` }}>
            {months.map((_, index) => (
              <div 
                key={index} 
                className="border-r border-border-subtle last:border-r-0 h-full"
              />
            ))}
          </div>

          {/* Tasks */}
          <div className="space-y-6 pt-6 relative">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={cn(
                  "group relative h-10",
                  task.nivel_hierarquia === 0 && "font-medium"
                )}
                style={{ marginLeft: `${task.nivel_hierarquia * 16}px` }}
              >
                {/* Baseline bar */}
                {task.inicio_linha_base && task.termino_linha_base && (
                  <div
                    className="absolute h-3 top-4 rounded-full bg-gray-300/50"
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
                      "absolute h-8 rounded-full shadow-md transition-all cursor-pointer",
                      "hover:brightness-110",
                      getTaskStatusColor(task)
                    )}
                    style={{
                      left: `${getTaskPosition(task.data_inicio, projectStart, projectEnd)}%`,
                      width: `${getTaskBarWidth(task.data_inicio, task.data_termino, projectStart, projectEnd)}%`,
                      top: '2px'
                    }}
                    title={getTaskTooltip(task)}
                  >
                    {/* Task name overlay */}
                    <div className="absolute inset-0 flex items-center px-3 text-sm text-white font-medium">
                      <span className="truncate">{task.nome}</span>
                    </div>

                    {/* Progress indicator */}
                    {task.percentual_real > 0 && task.percentual_real < 100 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-green-500/90 rounded-full"
                        style={{ width: `${task.percentual_real}%` }}
                      />
                    )}
                  </div>
                )}

                {/* Dependency arrow */}
                {task.predecessor_id && (
                  <div className="absolute top-1/2 transform -translate-y-1/2">
                    <div
                      className="absolute h-px w-4 bg-gray-400"
                      style={{
                        left: `${getTaskPosition(
                          tasks.find(t => t.id === task.predecessor_id)?.data_termino || null,
                          projectStart,
                          projectEnd
                        )}%`,
                      }}
                    >
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-8 flex items-center gap-6 justify-end border-t pt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500/90" />
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/90" />
              <span>Em andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/90" />
              <span>Atrasado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400/80" />
              <span>Não iniciado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
