/**
 * Getting rows of cell text out of whatever file the organiser drops on us.
 *
 * SheetJS reads .xls as well as .xlsx, and chess-results hands out .xls — so
 * requiring .xlsx would mean asking every user to open and re-save their
 * export before they can use the tool. It is loaded on demand because it is
 * ~900 KB, and pinned to the build vendored in `vendor/` rather than the npm
 * copy, which is years behind and carries a known prototype-pollution advisory
 * that a hostile workbook could reach.
 */

import type { SourceRow } from './swissManager';

export type LoadedSheet = {
  name: string;
  rows: SourceRow[];
};

export async function readSheets(data: ArrayBuffer): Promise<LoadedSheet[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
  return workbook.SheetNames.map((name) => ({
    name,
    // raw:false gives the text the spreadsheet displays, which is what every
    // parser here expects — "4½" stays "4½" and "1993/00/00" stays itself.
    rows: XLSX.utils.sheet_to_json<SourceRow>(workbook.Sheets[name], {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    }),
  }));
}
