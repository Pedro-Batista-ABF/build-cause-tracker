
import { supabase } from "@/integrations/supabase/client";
import { getRiskClassification } from "./ppcCalculation";

export const calculateDelayRisk = (ppc: number, varianceHistory?: number[]): number => {
  let baseRisk = Math.max(0, 100 - ppc);
  
  // Melhorar análise de tendência
  if (varianceHistory && varianceHistory.length > 2) {
    const recentTrend = varianceHistory.slice(-3); // Últimos 3 pontos
    const isContinuouslyDecreasing = recentTrend.every((value, index) => 
      index === 0 || value < recentTrend[index - 1]
    );
    
    if (isContinuouslyDecreasing) {
      baseRisk = Math.min(100, baseRisk + 20);
    }
  }
  
  return Math.round(baseRisk);
};

export const updateRiskAnalysis = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    // Log para rastrear chamadas de atualização
    console.log('Iniciando atualização da análise de risco');
    
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select(`
        id, 
        name,
        discipline,
        responsible,
        daily_progress (
          date,
          planned_qty,
          actual_qty
        )
      `);

    if (activitiesError) throw activitiesError;

    const currentWeek = getWeekLabel(new Date());
    const riskUpdates = [];

    for (const activity of activities || []) {
      if (!activity.daily_progress || activity.daily_progress.length === 0) continue;
      
      let totalPlanned = 0;
      let totalActual = 0;
      const varianceHistory = [];
      
      activity.daily_progress.forEach((progress: any) => {
        if (progress.planned_qty && progress.actual_qty) {
          totalPlanned += Number(progress.planned_qty);
          totalActual += Number(progress.actual_qty);
          const dailyVariance = (Number(progress.actual_qty) / Number(progress.planned_qty)) * 100 - 100;
          varianceHistory.push(dailyVariance);
        }
      });
      
      const ppc = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
      
      const riskPct = calculateDelayRisk(ppc, varianceHistory);
      const classification = getRiskClassification(ppc);
      
      // Log para depuração
      console.log(`Atividade: ${activity.name}, PPC: ${ppc}%, Risco: ${riskPct}%`);
      
      // Similar ao código original, mas com log adicional
      const { data: existingRisk } = await supabase
        .from('risco_atraso')
        .select('id')
        .eq('atividade_id', activity.id)
        .eq('semana', currentWeek)
        .maybeSingle();
        
      if (existingRisk) {
        riskUpdates.push(supabase
          .from('risco_atraso')
          .update({
            risco_atraso_pct: riskPct,
            classificacao: classification
          })
          .eq('id', existingRisk.id)
        );
      } else {
        riskUpdates.push(supabase
          .from('risco_atraso')
          .insert({
            atividade_id: activity.id,
            risco_atraso_pct: riskPct,
            classificacao: classification,
            semana: currentWeek
          })
        );
      }
    }
    
    if (riskUpdates.length > 0) {
      await Promise.all(riskUpdates);
      console.log(`Atualizados riscos para ${riskUpdates.length} atividades`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro detalhado na análise de risco:", error);
    return { success: false, error };
  }
};

export const getWeekLabel = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${date.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
};
