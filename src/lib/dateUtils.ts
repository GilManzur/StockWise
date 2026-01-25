/**
 * Formats a date to DD/MM/YYYY HH:mm (GMT+X) format
 * @param date - Date object or timestamp
 * @returns Formatted date string with timezone
 */
export const formatDateWithTimezone = (date: Date | number = new Date()): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  // Get timezone offset in hours
  const offsetMinutes = -d.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? '+' : '-';
  
  const timezone = offsetMins > 0 
    ? `GMT${sign}${offsetHours}:${String(offsetMins).padStart(2, '0')}`
    : `GMT${sign}${offsetHours}`;
  
  return `${day}/${month}/${year} ${hours}:${minutes} (${timezone})`;
};
