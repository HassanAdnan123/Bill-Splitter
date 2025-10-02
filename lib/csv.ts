export function parseCSV(csvText: string): string[][] {
  return csvText
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((cell) => cell.trim()))
    .filter((row) => row.length > 1 && row[0]);
}

export function generatePeopleCSV(rows: { name: string; contribution?: number }[]): string {
  const valid = rows.filter(r => r.name.trim());
  return valid.map(r => `${r.name},${r.contribution || 0}`).join("\n");
}

export function generateItemsCSV(rows: { name: string; price: number }[]): string {
  const valid = rows.filter(r => r.name.trim() && r.price > 0);
  return valid.map(r => `${r.name},${r.price}`).join("\n");
}


