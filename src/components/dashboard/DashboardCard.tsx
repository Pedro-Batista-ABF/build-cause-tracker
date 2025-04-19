
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
    <div className={cn("bg-card-bg rounded-lg p-5", className)}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <div className="text-accent-blue">{icon}</div>
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold text-text-primary">{value}</p>
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
