/**
 * Type-safe sorting utilities for tables and lists
 */

/**
 * Gets a value from an object safely for sorting, returning a default for null/undefined
 */
export function getSortValue<T>(
  item: T, 
  key: keyof T, 
  defaultValue: string | number = ''
): string | number {
  const val = item[key];
  
  if (val === null || val === undefined) {
    return defaultValue;
  }
  
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return val;
  
  // For other types, convert to string
  return String(val);
}

/**
 * Compare two values for sorting
 */
export function compareValues(
  aVal: string | number,
  bVal: string | number,
  sortOrder: 'asc' | 'desc'
): number {
  // Numeric comparison
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  }
  
  // String comparison
  const strA = String(aVal);
  const strB = String(bVal);
  const comparison = strA.localeCompare(strB, 'pt-BR');
  return sortOrder === 'asc' ? comparison : -comparison;
}

/**
 * Compare dates for sorting
 */
export function compareDates(
  aVal: string | Date | null | undefined,
  bVal: string | Date | null | undefined,
  sortOrder: 'asc' | 'desc'
): number {
  const dateA = aVal ? new Date(aVal).getTime() : 0;
  const dateB = bVal ? new Date(bVal).getTime() : 0;
  return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
}

/**
 * Generic sort function for arrays (supports multi-column sorting)
 */
export function sortArray<T>(
  items: T[],
  sortBy: keyof T | Array<{ column: keyof T, order: 'asc' | 'desc' }>,
  sortOrder?: 'asc' | 'desc',
  options?: {
    dateFields?: (keyof T)[];
    numericFields?: (keyof T)[];
  }
): T[] {
  const { dateFields = [], numericFields = [] } = options || {};
  
  const sortCriteria = Array.isArray(sortBy) 
    ? sortBy 
    : [{ column: sortBy, order: sortOrder || 'asc' }];

  if (sortCriteria.length === 0) return [...items];

  return [...items].sort((a, b) => {
    for (const { column, order } of sortCriteria) {
      const aVal = getSortValue(a, column);
      const bVal = getSortValue(b, column);
      let result = 0;
      
      // Date comparison
      if (dateFields.includes(column)) {
        result = compareDates(aVal as string, bVal as string, order);
      }
      // Numeric comparison
      else if (numericFields.includes(column)) {
        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;
        result = order === 'asc' ? numA - numB : numB - numA;
      }
      // Default comparison
      else {
        result = compareValues(aVal, bVal, order);
      }

      if (result !== 0) return result;
    }
    return 0;
  });
}
