
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Dashboard, {userName || 'Usuário'}
      </h1>
      <Button asChild className="bg-accent-blue hover:bg-accent-dark-blue">
        <Link to="/projects/new">
          <Plus className="mr-2 h-4 w-4" /> Novo Projeto
        </Link>
      </Button>
    </div>
  );
}
