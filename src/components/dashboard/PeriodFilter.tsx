
"use client";

import { Button } from "@/components/ui/button";

interface PeriodFilterProps {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
}

export function PeriodFilter({ activePeriod, onPeriodChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant={activePeriod === "1day" ? "default" : "outline"} 
        onClick={() => onPeriodChange("1day")}
      >
        1 Dia
      </Button>
      <Button 
        variant={activePeriod === "1week" ? "default" : "outline"} 
        onClick={() => onPeriodChange("1week")}
      >
        1 Semana
      </Button>
      <Button 
        variant={activePeriod === "2weeks" ? "default" : "outline"} 
        onClick={() => onPeriodChange("2weeks")}
      >
        2 Semanas
      </Button>
      <Button 
        variant={activePeriod === "4weeks" ? "default" : "outline"} 
        onClick={() => onPeriodChange("4weeks")}
      >
        4 Semanas
      </Button>
      <Button 
        variant={activePeriod === "1month" ? "default" : "outline"} 
        onClick={() => onPeriodChange("1month")}
      >
        1 Mês
      </Button>
      <Button 
        variant={activePeriod === "3months" ? "default" : "outline"} 
        onClick={() => onPeriodChange("3months")}
      >
        3 Meses
      </Button>
    </div>
  );
}
