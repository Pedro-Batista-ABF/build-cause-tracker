
import { Button } from "@/components/ui/button";
import { DailyProgress } from "./DailyProgress";
import { Progress } from "@/components/ui/progress";

interface ActivityRowProps {
  id: string;
  name: string;
  discipline: string;
  manager: string;
  responsible: string;
  unit: string;
  totalQty: number;
  progress: number;
  ppc: number;
  adherence: number;
}

export function ActivityRow({
  id,
  name,
  discipline,
  manager,
  responsible,
  unit,
  totalQty,
  progress,
  ppc,
  adherence,
}: ActivityRowProps) {
  return (
    <div className="bg-card hover:bg-accent/50 rounded-lg p-4 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{discipline}</p>
        </div>
        
        <div className="flex-1">
          <p className="text-sm">Responsável: {manager}</p>
          <p className="text-sm text-muted-foreground">Equipe: {responsible}</p>
        </div>
        
        <div className="w-full md:w-64">
          <div className="flex justify-between text-sm mb-1">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <div className="flex items-center gap-2">
          <DailyProgress
            activityId={id}
            activityName={name}
            unit={unit}
            totalQty={totalQty}
          />
          <Button variant="ghost" size="sm">Ver Detalhes</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div>
          <span className="text-muted-foreground">Quantidade:</span>
          <span className="ml-2">{totalQty} {unit}</span>
        </div>
        <div>
          <span className="text-muted-foreground">PPC:</span>
          <span className="ml-2">{ppc}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Aderência:</span>
          <span className="ml-2">{adherence}%</span>
        </div>
      </div>
    </div>
  );
}
