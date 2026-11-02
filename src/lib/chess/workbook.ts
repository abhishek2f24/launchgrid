/**
 * Excel in and Excel out for the chess winners tool.
 *
 * Runs in the browser: the tournament file never leaves the organiser's
 * machine, which is the whole reason this tool needs no account and no
 * upload. ExcelJS does both halves — reading avoids a second spreadsheet
 * dependency, and writing is required because the output carries merged
 * cells, fills and borders.
 *
 * The output layout (sheet name, column order, grey heading bars, per-section
 * serial numbers, footer credit) copies the desktop program's file so an
 * organiser can swap tools mid-season without reprinting their templates.
 */

import type { Workbook as ExcelWorkbook, Cell } from 'exceljs';

import { WORKBOOK_FOOTER } from './licence';
import type { Row, WinnerSection } from './winners';

export const OUTPUT_HEADERS = [
  'Serial No',
  'Name',
  'Rank',
  'Gender',
  'Rating',
  'Club',
  'Age',
  'Type',
  'Points',
  'Prize Money',
  'Winning Category',
] as const;

/** ExcelJS is ~900 KB; it loads when a file is actually processed, not on page view. */
async function exceljs() {
  return (await import('exceljs')).default;
}

export type ParsedWorkbook = {
  firstSheetName: string;
  firstSheetRows: Row[];
  sortRows: Row[];
  rankRows: Row[];
};

/** The text a cell displays. ExcelJS's own `text` handles rich text and formulas. */
function cellText(cell: Cell): string {
  const value = cell.value;
  if (value == null) return '';
  if (typeof value === 'object' && 'error' in value) return '';
  return cell.text ?? '';
}

function sheetRows(sheet: ExcelWorkbook['worksheets'][number]): Row[] {
  const width = Math.max(sheet.actualColumnCount || 0, sheet.columnCount || 0, 11);
  const rows: Row[] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    for (let column = 1; column <= width; column += 1) {
      cells.push(cellText(row.getCell(column)));
    }
    rows.push(cells);
  });
  return rows;
}

/** Thrown for the two input problems that deserve their own on-screen message. */
export class MissingSheetError extends Error {
  readonly sheet: 'sort' | 'Ranklist';

  constructor(sheet: 'sort' | 'Ranklist') {
    super(`There is no sheet with name as '${sheet}' in the uploaded excel file`);
    this.name = 'MissingSheetError';
    this.sheet = sheet;
  }
}

export async function parseWorkbook(data: ArrayBuffer): Promise<ParsedWorkbook> {
  const ExcelJS = await exceljs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  // Sheet names are matched ignoring case, as the desktop program does.
  const byName = (name: string) =>
    workbook.worksheets.find((sheet) => sheet.name.toLowerCase() === name);
  const sort = byName('sort');
  const rank = byName('ranklist');
  if (!sort) throw new MissingSheetError('sort');
  if (!rank) throw new MissingSheetError('Ranklist');

  const first = workbook.worksheets[0];
  return {
    firstSheetName: first?.name ?? '',
    firstSheetRows: first ? sheetRows(first) : [],
    sortRows: sheetRows(sort),
    rankRows: sheetRows(rank),
  };
}

/** WinnerList_02-11-2026_14_05_33.xlsx */
export function outputFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  const time = `${pad(now.getHours())}_${pad(now.getMinutes())}_${pad(now.getSeconds())}`;
  return `WinnerList_${date}_${time}.xlsx`;
}

const DEFAULT_ROW_HEIGHT = 15;

export async function buildWinnerWorkbook(
  sections: WinnerSection[],
  title: string | null,
): Promise<Blob> {
  const ExcelJS = await exceljs();
  const out = new ExcelJS.Workbook();
  const sheet = out.addWorksheet('WinnersList');

  const thin = { style: 'thin' as const };
  const medium = { style: 'medium' as const };
  const box = (style: { style: 'thin' | 'medium' }) => ({
    top: style,
    left: style,
    bottom: style,
    right: style,
  });

  /** The merged grey bar used for the title and each category heading. */
  const bar = (rowNo: number, text: string) => {
    sheet.mergeCells(rowNo, 1, rowNo, OUTPUT_HEADERS.length);
    const cell = sheet.getCell(rowNo, 1);
    cell.value = text;
    cell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = box(medium);
  };

  let r = 1;
  if (title) {
    const lines = title.split('\n').length - 1;
    const n = lines === 0 ? 1 : lines === 1 ? 2 : lines;
    bar(r, title);
    sheet.getRow(r).height = DEFAULT_ROW_HEIGHT * 2 * n;
    r += 2; // one empty row after the title
  }

  for (const section of sections) {
    bar(r, section.heading);
    r += 1;
    OUTPUT_HEADERS.forEach((header, i) => {
      const cell = sheet.getCell(r, i + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = box(medium);
    });
    r += 1;
    section.winners.forEach((player, i) => {
      const values = [
        i + 1,
        player.name,
        player.rank,
        player.gender,
        player.rating,
        player.club,
        player.age,
        player.type,
        player.points,
        player.prizeMoney,
        player.winningCategory,
      ];
      values.forEach((value, column) => {
        const cell = sheet.getCell(r, column + 1);
        cell.value = value;
        cell.border = box(thin);
      });
      r += 1;
    });
    r += 1; // empty row between sections
  }

  // The licence asks for the author's credit to travel with the software.
  for (const line of WORKBOOK_FOOTER) {
    sheet.getCell(r, 1).value = line;
    r += 1;
  }

  autoSizeColumns(sheet);

  const buffer = await out.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** ExcelJS has no auto-fit, so width comes from the longest line in each column. */
function autoSizeColumns(sheet: ExcelWorkbook['worksheets'][number]) {
  sheet.columns?.forEach((column) => {
    let longest = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      // Merged heading bars would make every column as wide as the title.
      if (cell.isMerged) return;
      for (const line of String(cell.value ?? '').split('\n')) {
        longest = Math.max(longest, line.length + 2);
      }
    });
    column.width = Math.min(longest, 60);
  });
}

/**
 * A correctly formatted workbook to start from. Organisers copy their own
 * Swiss-Manager export over the Ranklist sheet, which is far more reliable
 * than reading the format rules and building the file by hand.
 */
export async function buildSampleWorkbook(): Promise<Blob> {
  const ExcelJS = await exceljs();
  const out = new ExcelJS.Workbook();

  const titleSheet = out.addWorksheet('Tournament');
  titleSheet.addRow(['District Open Chess Championship 2026']);
  titleSheet.addRow(['Town Hall, Vadodara — 12 to 14 December 2026']);
  titleSheet.addRow(['Main Event — Final Ranking after 7 rounds']);
  titleSheet.getColumn(1).width = 56;

  const sort = out.addWorksheet('sort');
  sort.addRow(['Prize', 'Prize Money']);
  [
    ['Main_1', 10000],
    ['Main_2', 7000],
    ['Main_3', 5000],
    ['Below_1800', 2000],
    ['Below_1600', 1500],
    ['Un', 1000],
    ['U15', 1000],
    ['W', 1000],
    ['GOA_F', 500],
    ['U11', 'Trophy'],
  ].forEach((row) => sort.addRow(row));
  sort.getRow(1).font = { bold: true };
  sort.getColumn(1).width = 16;
  sort.getColumn(2).width = 14;

  const rank = out.addWorksheet('Ranklist');
  rank.addRow(['Rank', 'SNo.', 'Title', 'Name', 'Gender', 'IRtg', 'Club', 'Age', 'Type', 'Gr', 'Pts']);
  [
    [1, 1, 'GM', 'Player A', 'M', 2100, 'GOA', 30, '', '', '7.5'],
    [2, 2, '', 'Player B', 'M', 1750, 'MH', 14, 'U15', '', '7'],
    [3, 3, '', 'Player C', 'F', 1950, 'GOA', 25, '', '', '6.5'],
    [4, 4, '', 'Player D', 'M', 1700, 'KA', 40, '', '', '6'],
    [5, 5, '', 'Player E', 'M', 0, 'GOA', 12, 'U13', '', '5.5'],
    [6, 6, '', 'Player F', 'F', 1550, 'GOA', 13, '', '', '5'],
    [7, 7, '', 'Player G', 'M', 1500, 'KA', 10, 'U11', '', '4.5'],
    [8, 8, '', 'Player H', 'M', 0, 'MH', 14, 'U15', '', '4'],
    [9, 9, '', 'Player I', 'F', 1400, 'KA', 35, '', 'PC', '3.5'],
    [10, 10, '', 'Player J', 'F', 1300, 'GOA', 16, '', '', '3'],
  ].forEach((row) => rank.addRow(row));
  rank.getRow(1).font = { bold: true };
  rank.getColumn(4).width = 18;

  const buffer = await out.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
