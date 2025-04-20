
import { analyzeTrend } from './riskTrendAnalysis';

/**
 * Calculates the delay risk based on PPC and variance history
 */
export const calculateDelayRisk = (ppc: number, varianceHistory?: number[]): number => {
  let baseRisk = Math.max(0, 100 - ppc);
  
  // Add trend analysis impact
  const trendRisk = analyzeTrend(varianceHistory);
  baseRisk = Math.min(100, baseRisk + trendRisk);
  
  return Math.round(baseRisk);
};
