
/**
 * Analyzes the trend in variance history to determine risk increase
 */
export const analyzeTrend = (varianceHistory?: number[]): number => {
  if (!varianceHistory || varianceHistory.length < 3) return 0;
  
  const recentTrend = varianceHistory.slice(-3); // Last 3 points
  const isContinuouslyDecreasing = recentTrend.every((value, index) => 
    index === 0 || value < recentTrend[index - 1]
  );
  
  return isContinuouslyDecreasing ? 20 : 0;
};
