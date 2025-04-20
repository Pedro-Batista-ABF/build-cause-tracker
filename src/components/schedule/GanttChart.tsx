
import { useMemo } from "react";
import { ScheduleTask } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";

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

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="gantt-chart">
          {/* Header com meses */}
          <div className="flex border-b mb-4">
            <div className="w-64 flex-shrink-0"></div>
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

          {/* Tarefas */}
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center min-h-[2rem]">
                <div 
                  className="w-64 flex-shrink-0 truncate pr-4 text-sm"
                  style={{ paddingLeft: `${task.nivel_hierarquia * 16}px` }}
                >
                  {task.nome}
                </div>
                <div className="flex-1 relative h-6">
                  {task.data_inicio && task.data_termino && (
                    <div
                      className={`absolute h-full rounded ${
                        task.percentual_real === 100
                          ? "bg-green-500"
                          : task.percentual_real === 0
                          ? "bg-gray-300"
                          : "bg-blue-500"
                      }`}
                      style={getTaskPosition(task)}
                    >
                      {task.percentual_real > 0 && (
                        <div
                          className="absolute inset-y-0 left-0 bg-green-500 rounded"
                          style={{ width: `${task.percentual_real}%` }}
                        />
                      )}
                    </div>
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
