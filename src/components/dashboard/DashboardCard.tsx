
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  className?: string;
}

export function DashboardCard({ title, value, icon, description, className }: DashboardCardProps) {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
        <div className="text-primary">{icon}</div>
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
