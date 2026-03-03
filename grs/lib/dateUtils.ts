/**
 * Utility functions for handling dates and timezones
 * Ensures consistent local time display across the application
 */

/**
 * Format a date string to a relative time format (e.g., "2m ago", "3h ago")
 * Handles timezone conversion properly for local time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // If the date is invalid, return the original string
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatLocalDate(dateString);
}

/**
 * Format a date string to a local date string
 * Automatically converts from UTC (in database) to local timezone
 */
export function formatLocalDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to include local time
 * Shows date and time in user's local timezone
 */
export function formatLocalDateTime(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get current UTC timestamp in ISO format
 * Use this for all database timestamps to ensure consistency
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert a local date to UTC ISO string for database storage
 */
export function localDateToUTC(date: Date): string {
  return date.toISOString();
}
