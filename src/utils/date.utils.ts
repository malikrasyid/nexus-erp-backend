export interface ParsedRange {
    start: Date | null;
    end: Date | null;
    inclusiveStart: boolean;
    inclusiveEnd: boolean;
  }
  
  /**
   * Parses a PostgreSQL TSRANGE string into a JS object.
   * Example input: "[2026-01-29 08:00, 2026-01-29 17:00)"
   */
  export const parsePostgresRange = (rangeStr: string): ParsedRange => {
    // Regex to match: [ or ( + start + comma + end + ] or )
    const regex = /^([\[\(])"?(.*?)"?,"?(.*?)"?([\]\)])$/;
    const matches = rangeStr.match(regex);
  
    if (!matches) {
      throw new Error('Invalid PostgreSQL range format');
    }
  
    const [_, startBrack, startStr, endStr, endBrack] = matches;
  
    return {
      start: startStr ? new Date(startStr) : null,
      end: endStr ? new Date(endStr) : null,
      inclusiveStart: startBrack === '[',
      inclusiveEnd: endBrack === ']',
    };
  };
  
  /**
   * Formats a Date range into a PostgreSQL-compatible TSRANGE string.
   */
  export const formatPostgresRange = (start: Date, end: Date): string => {
    return `[${start.toISOString()},${end.toISOString()})`;
  };