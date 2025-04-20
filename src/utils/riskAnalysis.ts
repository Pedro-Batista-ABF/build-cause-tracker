
import { supabase } from "@/integrations/supabase/client";
import { getRiskClassification } from "./ppcCalculation";
import { calculateDelayRisk } from "./riskCalculation";
import { getWeekLabel } from "./dateUtils";

export const updateRiskAnalysis = async (): Promise<{ success: boolean; error?: any }> => {
  try {
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
      
      console.log(`Atividade: ${activity.name}, PPC: ${ppc}%, Risco: ${riskPct}%`);
      
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
