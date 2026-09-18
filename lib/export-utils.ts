/**
 * Lightweight browser utility to export data as an RFC 4180 CSV file.
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const escapeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    let str = String(cell);
    // Neutralize spreadsheet formula injection (CWE-1236)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser print dialog for the current view.
 */
export function triggerPrint() {
  window.print();
}
