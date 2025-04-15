import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = {
  startDate: Date;
  endDate: Date;
  label: string;
};

export type DateRangeOption = '7d' | '30d' | 'custom';

export function getDateRangeFromOption(option: DateRangeOption): DateRange {
  const today = new Date();
  
  switch (option) {
    case '7d':
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today),
        label: 'Last 7 days'
      };
    case '30d':
      return {
        startDate: startOfDay(subDays(today, 29)),
        endDate: endOfDay(today),
        label: 'Last 30 days'
      };
    case 'custom':
      // Default to last 14 days for custom until user selects
      return {
        startDate: startOfDay(subDays(today, 13)),
        endDate: endOfDay(today),
        label: 'Custom range'
      };
    default:
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today),
        label: 'Last 7 days'
      };
  }
}

export function formatDateRange(range: DateRange): string {
  const start = format(range.startDate, 'MMM d, yyyy');
  const end = format(range.endDate, 'MMM d, yyyy');
  return `${start} - ${end}`;
}

export function getDaysInRange(range: DateRange): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((range.endDate.getTime() - range.startDate.getTime()) / millisecondsPerDay) + 1;
}
