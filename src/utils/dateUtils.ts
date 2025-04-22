
/**
 * Generates a week label in the format YYYY-WW
 */
export const getWeekLabel = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${date.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Formats a date string to display in the local timezone
 * This prevents the timezone shift that causes dates to appear off by one day
 */
export const formatLocalDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Create date object without timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR');
};
