
/**
 * Utility functions for calculating PPC (Percentage of Plan Completed)
 */

/**
 * Calculates the PPC (Percentage of Plan Completed) based on actual and planned quantities
 * @param actualQty - The actual quantity completed
 * @param plannedQty - The planned quantity to be completed
 * @returns The PPC as a percentage (0-100), rounded to the nearest integer
 */
export const calculatePPC = (actualQty: number, plannedQty: number): number => {
  // Avoid division by zero or negative values
  if (!plannedQty || plannedQty <= 0) return 0;
  
  // Ensure we don't have negative actual quantities
  const normalizedActualQty = Math.max(0, actualQty || 0);
  
  // Calculate percentage and round to nearest integer
  // Cap at 100% to avoid PPC values over 100%
  return Math.min(100, Math.round((normalizedActualQty / plannedQty) * 100));
};

/**
 * Calculates the average PPC from a collection of progress data
 * @param progressData - Array of progress data containing actual_qty and planned_qty
 * @returns The average PPC as a percentage (0-100)
 */
export const calculateAveragePPC = (
  progressData: Array<{ actual_qty: number | null; planned_qty: number | null }>
): number => {
  // Track total planned and actual quantities
  let totalPlanned = 0;
  let totalActual = 0;
  let validEntries = 0;
  
  // Sum up all planned and actual quantities
  progressData.forEach(item => {
    if (item.planned_qty != null && item.actual_qty != null) {
      const plannedQty = Number(item.planned_qty);
      const actualQty = Number(item.actual_qty);
      
      if (!isNaN(plannedQty) && !isNaN(actualQty) && plannedQty > 0) {
        totalPlanned += plannedQty;
        totalActual += actualQty;
        validEntries++;
      }
    }
  });
  
  // Return 0 if no valid entries
  if (validEntries === 0 || totalPlanned === 0) return 0;
  
  // Calculate overall PPC from totals and cap at 100%
  return Math.min(100, Math.round((totalActual / totalPlanned) * 100));
};

/**
 * Calculates the cumulative PPC for a date range
 * @param progressData - Array of progress data containing actual_qty, planned_qty and date
 * @param startDate - Start date for the range (inclusive)
 * @param endDate - End date for the range (inclusive)
 * @returns The cumulative PPC as a percentage (0-100)
 */
export const calculateCumulativePPC = (
  progressData: Array<{ actual_qty: number | null; planned_qty: number | null; date: string }>,
  startDate?: string,
  endDate?: string
): number => {
  let totalPlanned = 0;
  let totalActual = 0;
  
  progressData.forEach(item => {
    try {
      if (!item.date) return;
      
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) return; // Skip invalid dates
      
      const isInRange = (!startDate || new Date(startDate) <= itemDate) && 
                      (!endDate || itemDate <= new Date(endDate));
                      
      if (isInRange && item.planned_qty != null && item.actual_qty != null) {
        const plannedQty = Number(item.planned_qty);
        const actualQty = Number(item.actual_qty);
        
        if (!isNaN(plannedQty) && !isNaN(actualQty) && plannedQty > 0) {
          totalPlanned += plannedQty;
          totalActual += actualQty;
        }
      }
    } catch (error) {
      console.error("Error processing date in calculateCumulativePPC:", error);
      // Skip invalid dates
    }
  });
  
  // Cap at 100% para evitar valores de PPC acima de 100%
  return Math.min(100, calculatePPC(totalActual, totalPlanned));
};

/**
 * Determines the risk classification based on PPC value
 * @param ppc - The PPC value
 * @returns Risk classification string: 'ALTO', 'MÉDIO', or 'BAIXO'
 */
export const getRiskClassification = (ppc: number): string => {
  if (ppc < 70) return 'ALTO';
  if (ppc < 85) return 'MÉDIO';
  return 'BAIXO';
};

/**
 * Calculates the schedule variance (SV) as a percentage
 * @param actualProgress - The actual progress percentage
 * @param plannedProgress - The planned progress percentage
 * @returns Schedule variance as a percentage (positive = ahead, negative = behind)
 */
export const calculateScheduleVariance = (actualProgress: number, plannedProgress: number): number => {
  return (actualProgress || 0) - (plannedProgress || 0);
};

/**
 * Determines the status based on schedule variance
 * @param variance - The schedule variance
 * @returns Status string: 'atrasado', 'atenção', or 'no prazo'
 */
export const getScheduleStatus = (variance: number): 'atrasado' | 'atenção' | 'no prazo' => {
  if (variance < -10) return 'atrasado';
  if (variance < 0) return 'atenção';
  return 'no prazo';
};

/**
 * Calcula a aderência baseada em dados de progresso
 * @param progressData - Array de dados de progresso contendo actual_qty e planned_qty
 * @returns Aderência como uma porcentagem (0-100)
 */
export const calculateAdherence = (
  progressData: Array<{ actual_qty: number | null; planned_qty: number | null }>
): number => {
  let compliantEntries = 0;
  let totalEntries = 0;
  
  // Contar entradas que atendem às metas
  progressData.forEach(item => {
    if (item.planned_qty != null && item.actual_qty != null) {
      const plannedQty = Number(item.planned_qty);
      const actualQty = Number(item.actual_qty);
      
      if (!isNaN(plannedQty) && !isNaN(actualQty) && plannedQty > 0) {
        totalEntries++;
        if (actualQty >= plannedQty) {
          compliantEntries++;
        }
      }
    }
  });
  
  // Retornar 0 se não houver entradas válidas
  if (totalEntries === 0) return 0;
  
  // Calcular aderência geral
  return Math.round((compliantEntries / totalEntries) * 100);
};
