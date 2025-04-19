
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  name: string;
  client: string;
  contract: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'delayed';
  ppc?: number;
}

export function ProjectCard({
  id,
  name,
  client,
  contract,
  startDate,
  endDate,
  status,
  ppc
}: ProjectCardProps) {
  const statusConfig = {
    active: {
      className: "card-project-active",
      label: "Ativo",
      badge: "bg-moss text-white"
    },
    inactive: {
      className: "card-project-inactive",
      label: "Inativo",
      badge: "bg-gray-400 text-white"
    },
    delayed: {
      className: "card-project-delayed",
      label: "Atrasado",
      badge: "bg-rust text-white"
    }
  };

  const config = statusConfig[status];
  
  return (
    <Link to={`/projects/${id}`}>
      <Card className={cn("card-project", config.className)}>
        <div className="flex justify-between mb-2">
          <h3 className="font-medium text-lg">{name}</h3>
          <Badge className={config.badge}>{config.label}</Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-2">
          <p>Cliente: {client}</p>
          <p>Contrato: {contract}</p>
        </div>
        
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Período:</p>
            <p>{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
          </div>
          
          {ppc !== undefined && (
            <div className="text-right">
              <p className="text-muted-foreground">PPC:</p>
              <p className={cn(
                "font-bold",
                ppc >= 90 ? "text-moss" : ppc >= 70 ? "text-amber-500" : "text-rust"
              )}>
                {ppc}%
              </p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
