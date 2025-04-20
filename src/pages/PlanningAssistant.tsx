
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanningAssistantMessage } from '@/components/planning/PlanningAssistantMessage';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskAnalysisCard } from '@/components/risk/RiskAnalysisCard';
import { PlanningReport, RiscoAtraso } from '@/types/database';

export default function PlanningAssistant() {
  // Query for fetching the latest planning report
  const { 
    data: latestReport, 
    isLoading: isLoadingReport,
    refetch: refetchReport
  } = useQuery({
    queryKey: ['planning-report'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-current-report');
          
        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Erro ao buscar relatório');
        
        return data.report as PlanningReport;
      } catch (error) {
        console.error('Error fetching planning report:', error);
        toast.error('Erro ao carregar o relatório de planejamento');
        return null;
      }
    }
  });
  
  // Query for fetching risk analysis data
  const { 
    data: riskData = [],
    isLoading: isLoadingRisks,
    refetch: refetchRisks
  } = useQuery({
    queryKey: ['risk-analysis'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('risco_atraso')
          .select(`
            id,
            atividade_id,
            semana,
            risco_atraso_pct,
            classificacao,
            activities (
              name,
              discipline,
              responsible
            )
          `)
          .order('risco_atraso_pct', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        return data.map((item: RiscoAtraso) => ({
          id: item.id,
          atividade_id: item.atividade_id,
          atividade_nome: item.activities?.name || 'Atividade sem nome',
          risco_atraso_pct: item.risco_atraso_pct,
          classificacao: item.classificacao,
          semana: item.semana,
          responsible: item.activities?.responsible,
          discipline: item.activities?.discipline,
        }));
      } catch (error) {
        console.error('Error fetching risk analysis data:', error);
        toast.error('Erro ao carregar os dados de análise de risco');
        return [];
      }
    }
  });

  // Handle generating a new report
  const handleGenerateReport = async () => {
    toast.info('Gerando novo relatório de planejamento...');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-planning-report');
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar relatório');
      }
      
      refetchReport();
      refetchRisks();
      toast.success('Novo relatório gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar novo relatório');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Assistente de Planejamento Semanal
        </h1>
        <Button onClick={handleGenerateReport} disabled={isLoadingReport}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Gerar Novo Resumo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card-bg border-border-subtle shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo do Planejamento Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              {latestReport ? (
                <PlanningAssistantMessage 
                  content={latestReport.content} 
                  timestamp={latestReport.created_at}
                  isLoading={isLoadingReport}
                />
              ) : isLoadingReport ? (
                <PlanningAssistantMessage 
                  content="" 
                  timestamp={new Date().toISOString()}
                  isLoading={true}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum relatório de planejamento encontrado.
                  </p>
                  <Button onClick={handleGenerateReport}>
                    Gerar Primeiro Relatório
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <RiskAnalysisCard 
            risks={riskData}
            isLoading={isLoadingRisks}
          />
        </div>
      </div>
    </div>
  );
}
