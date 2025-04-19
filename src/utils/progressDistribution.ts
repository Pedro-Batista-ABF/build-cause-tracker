
import { add, differenceInDays, eachDayOfInterval, format } from 'date-fns';

export type DistributionType = 'Linear' | 'Personalizado' | 'Curva S';
export type PlanningType = 'Diário' | 'Semanal' | 'Mensal';

interface ProgressPoint {
  date: string;
  planned: number;
  cumulative: number;
}

export const calculateDistribution = (
  startDate: string,
  endDate: string,
  totalQuantity: number,
  distributionType: DistributionType
): ProgressPoint[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = differenceInDays(end, start) + 1;
  
  const dates = eachDayOfInterval({ start, end });
  
  switch (distributionType) {
    case 'Linear':
      return calculateLinearDistribution(dates, totalQuantity);
    case 'Curva S':
      return calculateSCurveDistribution(dates, totalQuantity);
    case 'Personalizado':
      return dates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        planned: 0,
        cumulative: 0
      }));
    default:
      return [];
  }
};

const calculateLinearDistribution = (dates: Date[], totalQuantity: number): ProgressPoint[] => {
  const dailyQuantity = totalQuantity / dates.length;
  let cumulative = 0;
  
  return dates.map(date => {
    cumulative += dailyQuantity;
    return {
      date: format(date, 'yyyy-MM-dd'),
      planned: Number(dailyQuantity.toFixed(2)),
      cumulative: Number(cumulative.toFixed(2))
    };
  });
};

const calculateSCurveDistribution = (dates: Date[], totalQuantity: number): ProgressPoint[] => {
  const totalDays = dates.length;
  let cumulative = 0;
  
  return dates.map((date, index) => {
    // S-curve formula using sigmoid function
    const progress = 1 / (1 + Math.exp(-12 * (index / totalDays - 0.5)));
    const previousCumulative = cumulative;
    cumulative = totalQuantity * progress;
    const planned = cumulative - previousCumulative;
    
    return {
      date: format(date, 'yyyy-MM-dd'),
      planned: Number(planned.toFixed(2)),
      cumulative: Number(cumulative.toFixed(2))
    };
  });
};
