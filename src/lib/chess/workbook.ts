/**
 * The Excel file an organiser takes away.
 *
 * Reading happens in `readSheet.ts` (SheetJS, which also reads the .xls that
 * chess-results hands out); ExcelJS is here because the free SheetJS build
 * cannot write cell styles, and a prize list that is going on a notice board
 * needs its headings to look like headings. It is imported on demand — ~900 KB
 * has no business loading for someone who is only reading the guide.
 */

import type { Workbook as ExcelWorkbook } from 'exceljs';

import type { Award } from './allocate';
import { isCash } from './allocate';
import { WORKBOOK_FOOTER } from './licence';

export const OUTPUT_HEADERS = [
  'Prize',
  'Name',
  'Rank',
  'Sex',
  'Rating',
  'Fed/Club',
  'Type',
  'Gr',
  'Points',
  'Prize Money',
] as const;

export type PrizeSection = { label: string; awards: Award[] };

async function exceljs() {
  return (await import('exceljs')).default;
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
  sections: PrizeSection[],
  title: string | null,
  options: { includeLegacyCredit?: boolean } = {},
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

  let total = 0;
  for (const section of sections) {
    bar(r, section.label);
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
    section.awards.forEach((award) => {
      const winner = award.winner;
      if (winner && isCash(award.amount)) total += Number(award.amount);
      const values = [
        award.place,
        winner?.name ?? 'Not awarded — nobody left',
        winner?.rank ?? '',
        winner?.female ? 'F' : '',
        winner ? (winner.rating === 0 ? 'Unrated' : winner.rating) : '',
        winner ? winner.club || winner.federation : '',
        winner?.type ?? '',
        winner?.group ?? '',
        winner?.points ?? '',
        award.amount,
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

  const totalCell = sheet.getCell(r, 1);
  totalCell.value = `Total prize money awarded: ${total}`;
  totalCell.font = { bold: true, size: 12 };
  r += 2;

  // The ChessWinners licence asks for the author's credit to travel with the
  // software, so it goes in the file the workbook mode produced.
  if (options.includeLegacyCredit) {
    for (const line of WORKBOOK_FOOTER) {
      sheet.getCell(r, 1).value = line;
      r += 1;
    }
  }
  sheet.getCell(r, 1).value = 'Generated with ChessGrid — https://chess.launchgrid.in';

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
