
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Helper function to get the start and end dates for a week number
 * @param year - The year
 * @param weekNum - The week number (1-53)
 * @returns Object with startDate and endDate as Date objects
 */
export function getWeekDates(year: number, weekNum: number) {
  // Calculate the date of the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Calculate the date of the first day of the week
  const daysToFirstWeek = (8 - firstDayOfYear.getDay()) % 7;
  const firstMondayOfYear = new Date(year, 0, 1 + daysToFirstWeek);
  
  // Calculate the date of the week we want
  const startDate = new Date(firstMondayOfYear);
  startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
  
  // Calculate the end date (Sunday of the week)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return { startDate, endDate };
}

/**
 * Formats a date range as a string
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate.toISOString())} - ${formatDate(endDate.toISOString())}`;
}

/**
 * Extracts the week and year from a week string in the format "YYYY-WW"
 * @param weekStr - Week string in format "YYYY-WW"
 * @returns Object with year and weekNum
 */
export function parseWeekString(weekStr: string): { year: number; weekNum: number } {
  const [yearStr, weekNumStr] = weekStr.split('-');
  return {
    year: parseInt(yearStr, 10),
    weekNum: parseInt(weekNumStr, 10)
  };
}

/**
 * Creates a week string in the format "YYYY-WW" from a date
 * @param date - The date
 * @returns Week string in format "YYYY-WW"
 */
export function getWeekStringFromDate(date: Date): string {
  const year = date.getFullYear();
  const weekNum = getWeekNumber(date);
  return `${year}-${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Gets the ISO week number for a given date
 * @param date - The date to get the week number for
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
