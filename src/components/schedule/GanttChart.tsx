
import { useMemo } from "react";
import { ScheduleTask } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GanttChartProps {
  tasks: ScheduleTask[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const projectStart = useMemo(() => {
    const dates = tasks
      .map(task => task.data_inicio)
      .filter(Boolean) as string[];
    return dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : new Date();
  }, [tasks]);

  const projectEnd = useMemo(() => {
    const dates = tasks
      .map(task => task.data_termino)
      .filter(Boolean) as string[];
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : new Date();
  }, [tasks]);

  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
  const monthsToShow = Math.ceil(totalDays / 30);

  const getTaskPosition = (task: ScheduleTask) => {
    if (!task.data_inicio || !task.data_termino) return { left: 0, width: 0 };
    
    const startDate = new Date(task.data_inicio);
    const endDate = new Date(task.data_termino);
    
    const left = ((startDate.getTime() - projectStart.getTime()) / (projectEnd.getTime() - projectStart.getTime())) * 100;
    const width = ((endDate.getTime() - startDate.getTime()) / (projectEnd.getTime() - projectStart.getTime())) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const months = useMemo(() => {
    const months = [];
    const currentDate = new Date(projectStart);
    
    for (let i = 0; i < monthsToShow; i++) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }, [projectStart, monthsToShow]);

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
    return `${task.nome}
Previsto: ${task.percentual_previsto || 0}%
Realizado: ${task.percentual_real || 0}%
${task.data_inicio ? `Início: ${new Date(task.data_inicio).toLocaleDateString('pt-BR')}` : ''}
${task.data_termino ? `Término: ${new Date(task.data_termino).toLocaleDateString('pt-BR')}` : ''}`;
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-6 overflow-x-auto">
        <div className="gantt-chart min-w-[800px]">
          {/* Header com meses */}
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

          {/* Tarefas */}
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
                  {task.data_inicio && task.data_termino && (
                    <div
                      className={cn(
                        "absolute h-full rounded shadow-sm transition-all",
                        "group-hover:ring-2 group-hover:ring-accent group-hover:ring-offset-1",
                        getTaskStatusColor(task)
                      )}
                      style={getTaskPosition(task)}
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
                </div>
              </div>
            ))}
          </div>

          {/* Grid lines for months */}
          <div className="absolute inset-0 flex pointer-events-none">
            {months.map((_, index) => (
              <div 
                key={index}
                className="flex-1 border-l border-border/20 first:border-l-0"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
