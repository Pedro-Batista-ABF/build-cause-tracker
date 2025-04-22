
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DailyProgress } from "./DailyProgress";
import { Progress } from "@/components/ui/progress";
import { ActivityDetails } from "./ActivityDetails";
import { Trash2, Edit } from "lucide-react";
import { DeleteActivityDialog } from "./DeleteActivityDialog";

interface ActivityRowProps {
  id: string;
  name: string;
  discipline: string;
  responsible: string;
  team: string;
  unit: string;
  totalQty: number;
  progress: number;
  ppc: number;
  adherence: number;
  startDate?: string | null;
  endDate?: string | null;
  onEdit?: (activityId: string) => void;
}

export function ActivityRow({
  id,
  name,
  discipline,
  responsible,
  team,
  unit,
  totalQty,
  progress,
  ppc,
  adherence,
  startDate,
  endDate,
  onEdit,
}: ActivityRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="bg-card hover:bg-accent/50 rounded-lg p-4 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{discipline}</p>
          {(startDate || endDate) && (
            <div className="text-xs text-muted-foreground mt-1">
              {startDate && (
                <span>Início: {startDate}</span>
              )}
              {startDate && endDate && <span className="mx-1">|</span>}
              {endDate && (
                <span>Fim: {endDate}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm">Responsável: {responsible}</p>
          <p className="text-sm text-muted-foreground">Equipe: {team}</p>
        </div>
        
        <div className="w-full md:w-64">
          <div className="flex justify-between text-sm mb-1">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Ocultar Detalhes" : "Ver Detalhes"}
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(id)}
              aria-label="Editar atividade"
            >
              <Edit className="h-4 w-4 text-primary" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
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

      {showDetails && (
        <div className="mt-6 border-t pt-4">
          <ActivityDetails activityId={id} />
          <DailyProgress
            activityId={id}
            activityName={name}
            unit={unit}
            totalQty={totalQty}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      )}

      <DeleteActivityDialog
        activityId={id}
        activityName={name}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
