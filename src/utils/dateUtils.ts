
/**
 * Generates a week label in the format YYYY-WW
 */
export const getWeekLabel = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${date.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
};
