
/**
 * Calculate distribution of planned progress over time
 */

export type DistributionType = 'Linear' | 'Curva S' | 'Personalizado';

interface ProgressPoint {
  date: string;
  planned: number;
  cumulative: number;
  dailyTarget: number; // New property for daily target
}

/**
 * Calculate the number of days between two dates
 */
const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Ensure at least 1 day
};

/**
 * Format a date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculate S-curve distribution (bell curve)
 * Uses a simple approximation of an S-curve where progress is slower at the beginning,
 * faster in the middle, and slower again at the end
 */
const calculateSCurve = (
  startDate: string,
  endDate: string,
  totalQuantity: number,
  totalDays: number
): ProgressPoint[] => {
  const result: ProgressPoint[] = [];
  let cumulativeProgress = 0;
  
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    // S-curve factor (0 to 1)
    // This creates a sigmoid-like curve where progress is slower at the start and end
    const normalizedProgress = i / totalDays;
    
    // Apply sigmoid function for S-curve: 1/(1+e^(-10*(x-0.5)))
    const sFactor = 1 / (1 + Math.exp(-10 * (normalizedProgress - 0.5)));
    
    // Calculate daily planned progress based on S-curve
    // This gives a percentage of total (0-1) based on position in timeline
    const progressFactor = sFactor - (i > 0 ? (1 / (1 + Math.exp(-10 * ((i-1)/totalDays - 0.5)))) : 0);
    
    // Multiply by total quantity to get actual daily value
    const dailyPlanned = totalQuantity * progressFactor;
    
    cumulativeProgress += dailyPlanned;
    
    // Ensure we don't exceed the total due to rounding
    const adjustedCumulative = Math.min(cumulativeProgress, totalQuantity);

    // Calculate the daily target based on S-curve
    // For the last day, we use the remaining quantity to ensure we reach exactly the total
    const dailyTarget = i === totalDays ? 
      Math.max(0, totalQuantity - (result[i-1]?.cumulative || 0)) : 
      dailyPlanned;
    
    result.push({
      date: formatDate(currentDate),
      planned: Number(dailyPlanned.toFixed(2)),
      cumulative: Number(adjustedCumulative.toFixed(2)),
      dailyTarget: Number(dailyTarget.toFixed(2))
    });
  }
  
  // Ensure last point is exactly the total
  if (result.length > 0) {
    result[result.length - 1].cumulative = totalQuantity;
  }
  
  return result;
};

/**
 * Calculate linear distribution (constant daily progress)
 */
const calculateLinear = (
  startDate: string,
  endDate: string,
  totalQuantity: number,
  totalDays: number
): ProgressPoint[] => {
  const result: ProgressPoint[] = [];
  const dailyProgress = totalQuantity / totalDays;
  
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    // For day 0, we have no progress yet
    const dailyPlanned = i === 0 ? 0 : dailyProgress;
    const cumulative = Math.min(dailyPlanned * i, totalQuantity);
    
    result.push({
      date: formatDate(currentDate),
      planned: Number(dailyPlanned.toFixed(2)),
      cumulative: Number(cumulative.toFixed(2)),
      dailyTarget: Number(dailyPlanned.toFixed(2))
    });
  }
  
  // Ensure last point is exactly the total
  if (result.length > 0) {
    result[result.length - 1].cumulative = totalQuantity;
  }
  
  return result;
};

/**
 * Calculate distribution based on specified type
 */
export const calculateDistribution = (
  startDate: string,
  endDate: string,
  totalQuantity: number,
  distributionType: DistributionType
): ProgressPoint[] => {
  if (!startDate || !endDate || !totalQuantity) {
    return [];
  }
  
  const totalDays = getDaysBetween(startDate, endDate);
  
  switch (distributionType) {
    case 'Linear':
      return calculateLinear(startDate, endDate, totalQuantity, totalDays);
    case 'Curva S':
      return calculateSCurve(startDate, endDate, totalQuantity, totalDays);
    case 'Personalizado':
      // For now, default to linear until custom distribution is implemented
      return calculateLinear(startDate, endDate, totalQuantity, totalDays);
    default:
      return calculateLinear(startDate, endDate, totalQuantity, totalDays);
  }
};

/**
 * Calculate a daily target goal based on the distribution type
 */
export const calculateDailyTarget = (
  startDate: string,
  endDate: string,
  totalQuantity: number,
  distributionType: DistributionType
): number => {
  if (!startDate || !endDate || !totalQuantity) {
    return 0;
  }
  
  const distribution = calculateDistribution(startDate, endDate, totalQuantity, distributionType);
  
  if (distribution.length <= 1) {
    return totalQuantity; // If only one day, the target is the total
  }
  
  // For linear, we return the constant daily target (excluding day 0)
  if (distributionType === 'Linear') {
    return distribution[1].dailyTarget;
  }
  
  // For S-curve and custom, we calculate the average daily target
  // This is a simplification - in a real app you might want to return the actual
  // daily target for the current date or some other logic
  const totalDailyTargets = distribution.reduce((sum, point) => sum + point.dailyTarget, 0);
  const avgDailyTarget = totalDailyTargets / (distribution.length - 1); // Excluding day 0
  
  return Number(avgDailyTarget.toFixed(2));
};
