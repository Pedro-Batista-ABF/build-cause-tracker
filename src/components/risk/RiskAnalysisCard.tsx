
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

export interface RiskItem {
  id: string;
  atividade_id: string;
  atividade_nome: string;
  risco_atraso_pct: number;
  classificacao: 'BAIXO' | 'MÉDIO' | 'ALTO';
  semana: string;
  responsible?: string;
  discipline?: string;
}

interface RiskAnalysisCardProps {
  risks: RiskItem[];
  isLoading?: boolean;
}

export function RiskAnalysisCard({ risks, isLoading = false }: RiskAnalysisCardProps) {
  const getRiskBadgeClass = (classification: string) => {
    switch (classification) {
      case 'ALTO': return 'bg-accent-red text-white';
      case 'MÉDIO': return 'bg-amber-500 text-white';
      case 'BAIXO': return 'bg-accent-green text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card-bg border-border-subtle shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent-red" />
          Risco de Atraso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted/20 animate-pulse rounded-md h-14" />
            ))}
          </div>
        ) : risks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma atividade com risco de atraso identificada neste período.
          </p>
        ) : (
          <div className="space-y-2">
            {risks.map((risk) => (
              <div key={risk.id} className="bg-card hover:bg-muted/20 p-3 rounded-md">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{risk.atividade_nome}</h4>
                    {(risk.responsible || risk.discipline) && (
                      <p className="text-xs text-muted-foreground">
                        {risk.discipline && `${risk.discipline} · `}
                        {risk.responsible && `${risk.responsible}`}
                      </p>
                    )}
                  </div>
                  <Badge className={getRiskBadgeClass(risk.classificacao)}>
                    {risk.risco_atraso_pct}% · {risk.classificacao}
                  </Badge>
                  <Link 
                    to={`/activities#${risk.atividade_id}`} 
                    className="text-accent-blue hover:text-accent-blue/80"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
