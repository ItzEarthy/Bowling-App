/**
 * Date/Time Utilities
 * Handles date/time operations with proper timezone support
 */

/**
 * Gets the current date/time in ISO format but preserving the local timezone
 * @returns {string} ISO 8601 formatted string with local timezone offset
 */
export function getLocalISOString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - (offset * 60 * 1000));
  return localTime.toISOString().slice(0, -1) + formatTimezoneOffset(offset);
}

/**
 * Formats timezone offset to ISO 8601 format
 * @param {number} offset - Timezone offset in minutes
 * @returns {string} Formatted timezone offset (e.g., "+05:30" or "-08:00")
 */
function formatTimezoneOffset(offset) {
  const sign = offset <= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Gets just the local date in ISO format (YYYY-MM-DD)
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date string to local ISO format
 * @param {string|Date} date - Date to convert
 * @returns {string} ISO 8601 formatted string with local timezone
 */
export function toLocalISOString(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const offset = d.getTimezoneOffset();
  const localTime = new Date(d.getTime() - (offset * 60 * 1000));
  return localTime.toISOString().slice(0, -1) + formatTimezoneOffset(offset);
}

/**
 * Formats a date for display in local timezone
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatLocalDate(date, options = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, options);
}

/**
 * Formats a date and time for display in local timezone
 * @param {string|Date} date - Date to format
 * @param {object} dateOptions - Intl.DateTimeFormat options for date
 * @param {object} timeOptions - Intl.DateTimeFormat options for time
 * @returns {string} Formatted date and time string
 */
export function formatLocalDateTime(date, dateOptions = {}, timeOptions = { hour: '2-digit', minute: '2-digit' }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toLocaleDateString(undefined, dateOptions);
  const timeStr = d.toLocaleTimeString(undefined, timeOptions);
  return `${dateStr} ${timeStr}`;
}

/**
 * Gets the start of day for a date in local timezone
 * @param {string|Date} date - Date to get start of day for
 * @returns {Date} Date object set to start of day in local timezone
 */
export function getLocalStartOfDay(date) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of day for a date in local timezone
 * @param {string|Date} date - Date to get end of day for
 * @returns {Date} Date object set to end of day in local timezone
 */
export function getLocalEndOfDay(date) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Checks if two dates are on the same day in local timezone
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if dates are on the same day
 */
export function isSameLocalDay(date1, date2) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Gets yesterday's date in local timezone
 * @returns {Date} Yesterday's date
 */
export function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

export default {
  getLocalISOString,
  getLocalDateString,
  toLocalISOString,
  formatLocalDate,
  formatLocalDateTime,
  getLocalStartOfDay,
  getLocalEndOfDay,
  isSameLocalDay,
  getYesterday
};
