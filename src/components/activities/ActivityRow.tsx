
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileEdit } from "lucide-react";
import { Link } from "react-router-dom";

interface ActivityRowProps {
  id: string;
  name: string;
  discipline: string;
  manager: string;
  responsible: string;
  unit: string;
  totalQty: number;
  progress: number;
  ppc?: number;
  adherence?: number;
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
  adherence
}: ActivityRowProps) {
  return (
    <div className="bg-card p-4 rounded-lg mb-2 shadow-sm">
      <div className="flex justify-between mb-3">
        <div>
          <h3 className="font-medium text-lg">{name}</h3>
          <div className="text-sm text-muted-foreground">
            <span>{discipline}</span>
            <span className="mx-2">•</span>
            <span>Enc: {manager}</span>
            <span className="mx-2">•</span>
            <span>Resp: {responsible}</span>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/activities/${id}/log`}>
              <FileEdit className="h-4 w-4 mr-1" />
              Apontar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Unidade / Quantidade</p>
          <p>{unit} / {totalQty}</p>
        </div>
        
        {ppc !== undefined && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">PPC Semana</p>
            <Badge className={cn(
              ppc >= 90 ? "ppc-high" : 
              ppc >= 70 ? "ppc-medium" : 
              "ppc-low"
            )}>
              {ppc}%
            </Badge>
            {ppc < 90 && (
              <Badge variant="outline" className="ml-2 text-rust border-rust">
                Análise de Causa
              </Badge>
            )}
          </div>
        )}
        
        {adherence !== undefined && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Aderência</p>
            <Badge variant="outline" className={cn(
              adherence >= 90 ? "text-moss border-moss" : 
              adherence >= 70 ? "text-amber-500 border-amber-500" : 
              "text-rust border-rust"
            )}>
              {adherence}%
            </Badge>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={cn(
              "progress-value",
              progress >= 90 ? "bg-moss" : 
              progress >= 70 ? "bg-amber-500" : 
              "bg-rust"
            )} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
