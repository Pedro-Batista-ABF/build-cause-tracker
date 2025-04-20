
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
  // Avoid division by zero
  if (plannedQty <= 0) return 0;
  
  // Calculate percentage and round to nearest integer
  return Math.round((actualQty / plannedQty) * 100);
};

/**
 * Calculates the average PPC from a collection of progress data
 * @param progressData - Array of progress data containing actual_qty and planned_qty
 * @returns The average PPC as a percentage (0-100)
 */
export const calculateAveragePPC = (
  progressData: Array<{ actual_qty: number | null; planned_qty: number | null }>
): number => {
  let totalPlanned = 0;
  let totalActual = 0;
  
  progressData.forEach(item => {
    if (item.planned_qty && item.actual_qty) {
      totalPlanned += Number(item.planned_qty);
      totalActual += Number(item.actual_qty);
    }
  });
  
  return calculatePPC(totalActual, totalPlanned);
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
