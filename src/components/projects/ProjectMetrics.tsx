
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";

interface ProjectMetricsProps {
  project: {
    id: string;
    ppc: number | null;
    start_date: string | null;
    end_date: string | null;
  };
  progressData: {
    date: string;
    value: number;
  }[];
}

export function ProjectMetrics({ project, progressData }: ProjectMetricsProps) {
  const daysRemaining = project.end_date
    ? Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Métricas do Projeto</CardTitle>
          <Link to={`/projects/${project.id}/schedule`}>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              Cronograma
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">PPC (Porcentagem Planejada Concluída)</span>
              <span className="text-sm font-medium">{project.ppc || 0}%</span>
            </div>
            <Progress value={project.ppc || 0} />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Status do Projeto</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dias Restantes</p>
                <p className="text-2xl font-bold">{daysRemaining || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold">65%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução do Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  name="Progresso"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
