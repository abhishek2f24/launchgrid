/**
 * A CSV parser for files exported by marketplaces, which are not clean.
 *
 * Structure only. Reading a money value out of a cell lives in `currency.ts`,
 * because it depends on the file's decimal convention and this module has no
 * business knowing about that.
 *
 * No dependency. A parser is ~80 lines and the alternative ships ~20KB to a
 * page whose promise is that it loads instantly — and this file is the one
 * place bugs would silently corrupt someone's money numbers, so it is worth
 * owning and reading.
 *
 * Handles what real payout exports actually contain: a UTF-8 BOM from Excel,
 * CRLF and lone-CR line endings, quoted fields with embedded commas and
 * newlines, doubled quotes as an escape, and semicolon or tab delimiters from
 * regional Excel settings.
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
  /** Rows whose column count did not match the header. */
  raggedRows: number;
}

const BOM = '﻿';

/**
 * Pick the delimiter by counting candidates outside quotes on the header line.
 *
 * Counting on the header alone is deliberate: a comma inside an address in row
 * 400 should not outvote the actual delimiter.
 */
function detectDelimiter(firstLine: string): string {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;

  for (const candidate of candidates) {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < firstLine.length; i += 1) {
      const char = firstLine[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === candidate && !inQuotes) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.startsWith(BOM) ? input.slice(1) : input;
  if (text.trim() === '') {
    return { headers: [], rows: [], delimiter: ',', raggedRows: 0 };
  }

  // The header ends at the first newline that is not inside quotes.
  let headerEnd = text.length;
  let scanning = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') scanning = !scanning;
    else if ((char === '\n' || char === '\r') && !scanning) {
      headerEnd = i;
      break;
    }
  }
  const delimiter = detectDelimiter(text.slice(0, headerEnd));

  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  const endField = () => {
    record.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    // A trailing newline produces one empty field; that is not a record.
    if (record.length > 1 || record[0] !== '') records.push(record);
    record = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // "" inside a quoted field is a literal quote.
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === '\r') {
      // Swallow the \n of a CRLF pair.
      if (text[i + 1] === '\n') i += 1;
      endRecord();
    } else if (char === '\n') {
      endRecord();
    } else {
      field += char;
    }
  }
  if (field !== '' || record.length > 0) endRecord();

  const [headerRow = [], ...dataRows] = records;
  const headers = headerRow.map((header) => header.trim());

  let raggedRows = 0;
  const rows = dataRows.map((row) => {
    if (row.length !== headers.length) raggedRows += 1;
    // Pad or trim so every row can be indexed by column position safely.
    const normalised = row.slice(0, headers.length);
    while (normalised.length < headers.length) normalised.push('');
    return normalised;
  });

  return { headers, rows, delimiter, raggedRows };
}
