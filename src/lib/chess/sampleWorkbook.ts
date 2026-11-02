/**
 * A correctly formatted ChessWinners workbook to start from.
 *
 * Only the workbook mode needs this: an organiser coming from chess-results
 * uploads their own exports and never sees it.
 */

export async function buildSampleWorkbook(): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
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
