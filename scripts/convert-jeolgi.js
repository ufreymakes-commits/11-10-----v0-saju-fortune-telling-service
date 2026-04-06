// Script to convert jeolgi-table.txt to TypeScript data file
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../lib/saju/jeolgi-table.txt');
const outputPath = path.join(__dirname, '../lib/saju/jeolgi-data.ts');

const fileContent = fs.readFileSync(inputPath, 'utf-8');
const lines = fileContent.split('\n');

let output = `// Auto-generated jeolgi (solar terms) data
// 1900-2059년 24절기 데이터 (UTC 기준)
// Format: [year, [[month, day, hour, minute], ...24 terms]]

export interface JeolgiTerm {
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface JeolgiYear {
  year: number;
  terms: JeolgiTerm[];
}

function parseDateTime(str: string): JeolgiTerm | null {
  if (!str || str.trim() === '') return null;
  const parts = str.trim().split(' ');
  if (parts.length !== 2) return null;
  const dateParts = parts[0].split('-');
  const timeParts = parts[1].split(':');
  if (dateParts.length !== 3 || timeParts.length < 2) return null;
  return {
    month: parseInt(dateParts[1], 10),
    day: parseInt(dateParts[2], 10),
    hour: parseInt(timeParts[0], 10),
    minute: parseInt(timeParts[1], 10)
  };
}

// Raw data: [year, term1, term2, ... term24]
// Each term is "YYYY-MM-DD HH:MM:SS" format
export const JEOLGI_RAW_DATA: [number, ...string[]][] = [\n`;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const columns = line.split('\t');
  if (columns.length < 25) continue;
  
  const year = parseInt(columns[0], 10);
  if (isNaN(year)) continue;
  
  const terms = [];
  for (let j = 1; j <= 24; j++) {
    terms.push(`"${columns[j].trim()}"`);
  }
  
  output += `  [${year}, ${terms.join(', ')}],\n`;
}

output += `];

// Parsed data cache
let _parsedData: JeolgiYear[] | null = null;

export function getJeolgiData(): JeolgiYear[] {
  if (_parsedData) return _parsedData;
  
  _parsedData = JEOLGI_RAW_DATA.map(([year, ...termStrings]) => {
    const terms: JeolgiTerm[] = termStrings.map(str => {
      const term = parseDateTime(str);
      return term || { month: 1, day: 1, hour: 0, minute: 0 };
    });
    return { year, terms };
  });
  
  return _parsedData;
}

export function getJeolgiForYear(year: number): JeolgiYear | null {
  const data = getJeolgiData();
  return data.find(entry => entry.year === year) || null;
}
`;

fs.writeFileSync(outputPath, output, 'utf-8');
console.log('Generated', outputPath);
console.log('Total years:', lines.length - 2);
