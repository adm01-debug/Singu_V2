/**
 * Utilities for exporting data to various formats
 */

/**
 * Exports an array of objects to a CSV file and triggers a download
 */
export function exportToCSV(data: Array<Record<string, unknown>>, fileName: string) {
  if (!data || !data.length) return;

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        // Handle null/undefined
        if (val === null || val === undefined) return '""';
        
        // Handle arrays (like tags)
        if (Array.isArray(val)) {
          return `"${val.join('; ').replace(/"/g, '""')}"`;
        }
        
        // Handle strings with commas, quotes or newlines
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        
        return stringVal;
      }).join(',')
    )
  ];

  if (typeof document === 'undefined') return;
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
