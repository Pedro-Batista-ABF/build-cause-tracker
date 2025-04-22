import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DailyProgress } from "./DailyProgress";
import { Progress } from "@/components/ui/progress";
import { ActivityDetails } from "./ActivityDetails";
import { Trash2, Edit, Calendar, Clock } from "lucide-react";
import { DeleteActivityDialog } from "./DeleteActivityDialog";
import { formatDate } from "@/lib/utils";

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
            <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-2">
              {startDate && (
                <div className="flex items-center space-x-1 bg-soft-purple/30 px-2 py-1 rounded">
                  <Calendar className="h-3 w-3 text-primary-purple" />
                  <span>Início: {formatDate(startDate)}</span>
                </div>
              )}
              {startDate && endDate && <span className="mx-1 text-muted-foreground">|</span>}
              {endDate && (
                <div className="flex items-center space-x-1 bg-soft-green/30 px-2 py-1 rounded">
                  <Clock className="h-3 w-3 text-soft-green" />
                  <span>Fim: {formatDate(endDate)}</span>
                </div>
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
