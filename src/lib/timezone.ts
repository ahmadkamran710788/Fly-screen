/**
 * Timezone Utility for GMT+1 (Central European Time)
 *
 * This utility provides consistent timezone conversion throughout the application.
 * All dates are stored in UTC in the database and displayed in GMT+1 timezone.
 */

const GMT1_OFFSET_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Convert a UTC date to GMT+1 by interpreting the UTC time components in GMT+1
 * @param utcDate - Date object in UTC timezone
 * @returns Date object representing the same calendar date/time in GMT+1
 */
export function toGMT1(utcDate: Date | string | null | undefined): Date {
  if (!utcDate) {
    // Get current time and convert to GMT+1
    const now = new Date();
    const utcTime = now.getTime();
    return new Date(utcTime + GMT1_OFFSET_MS);
  }

  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  // Get the UTC time components and interpret them in GMT+1
  // by adding the GMT+1 offset to the timestamp
  return new Date(date.getTime() + GMT1_OFFSET_MS);
}

/**
 * Convert a GMT+1 date to UTC
 * @param gmt1Date - Date object in GMT+1 timezone
 * @returns Date object adjusted to UTC
 */
export function toUTC(gmt1Date: Date | string): Date {
  const date = typeof gmt1Date === 'string' ? new Date(gmt1Date) : gmt1Date;
  return new Date(date.getTime() - GMT1_OFFSET_MS);
}

/**
 * Format a UTC date in GMT+1 timezone as dd/MM/yyyy
 * @param date - Date object (UTC from database) or string
 * @param isAlreadyGMT1 - Set to true if you've already converted to GMT+1 (not recommended)
 * @returns Formatted date string in GMT+1
 */
export function formatDateGMT1(date: Date | string | null | undefined, isAlreadyGMT1: boolean = false): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Use Intl.DateTimeFormat to format in GMT+1 timezone
  // This properly handles timezone conversion without timestamp manipulation
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', // GMT+1 (CET) - you can also use 'Europe/Berlin', 'Europe/Amsterdam', etc.
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return formatter.format(dateObj);
}

/**
 * Get the start and end of a day in GMT+1, converted to UTC for database queries
 * This is used for date filtering in API queries
 *
 * @param dateString - Date string in YYYY-MM-DD format (user's selected date in GMT+1)
 * @returns Object with start and end Date objects in UTC
 */
export function getDayRangeInUTC(dateString: string): { start: Date; end: Date } | null {
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2]);

  // User selected date represents a day in GMT+1 timezone
  // For example, "2025-11-21" means 2025-11-21 00:00:00 to 23:59:59 in GMT+1
  // Convert to UTC: 2025-11-20 23:00:00 to 2025-11-21 22:59:59 in UTC

  // Start of day in GMT+1 = previous day 23:00:00 UTC
  const start = new Date(Date.UTC(year, month, day - 1, 23, 0, 0, 0));

  // End of day in GMT+1 = same day 22:59:59.999 UTC
  const end = new Date(Date.UTC(year, month, day, 22, 59, 59, 999));

  return { start, end };
}

/**
 * Get current date and time in GMT+1
 * @returns Date object representing current time in GMT+1
 */
export function nowGMT1(): Date {
  return toGMT1(new Date());
}

/**
 * Format date and time in GMT+1 timezone
 * @param date - Date object (UTC from database) or string
 * @param isAlreadyGMT1 - Set to true if you've already converted to GMT+1 (not recommended)
 * @returns Formatted datetime string (dd/MM/yyyy HH:mm:ss) in GMT+1
 */
export function formatDateTimeGMT1(date: Date | string | null | undefined, isAlreadyGMT1: boolean = false): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Use Intl.DateTimeFormat to format in GMT+1 timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', // GMT+1 (CET)
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return formatter.format(dateObj);
}

/**
 * Check if a date is in GMT+1 timezone (heuristic check)
 * This is a helper to avoid double conversion
 * @param date - Date object to check
 * @returns true if date appears to be in GMT+1
 */
export function isGMT1Date(date: Date): boolean {
  // This is a heuristic check - not 100% accurate
  // We check if the timezone offset is -60 minutes (GMT+1)
  return date.getTimezoneOffset() === -60;
}
