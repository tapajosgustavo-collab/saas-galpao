import ExcelJS from "exceljs";

export interface Coluna<T> {
  header: string;
  key: keyof T & string;
  width?: number;
  format?: (value: T[keyof T], row: T) => string | number | Date | null;
}

export type CellFormatter = "money" | "date" | "percent" | "number";

/**
 * Gera um Buffer de arquivo .xlsx com uma planilha contendo a lista
 * de objetos. Aplica auto-largura, header em negrito, e tipos
 * apropriados (datas, monetario).
 */
export async function buildXlsx<T>(
  sheetName: string,
  rows: T[],
  columns: Array<Coluna<T> & { type?: CellFormatter }>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SaaS Galpao";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
  }));

  // Estilo do cabecalho
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 22;

  for (const row of rows) {
    const cells: Record<string, string | number | Date | null> = {};
    for (const c of columns) {
      const raw = row[c.key];
      const value = c.format
        ? c.format(raw, row)
        : (raw as unknown as string | number | Date | null);
      cells[c.key] = value;
    }
    const r = ws.addRow(cells);

    // Aplica formato por tipo
    columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (c.type === "money") cell.numFmt = '"R$" #,##0.00';
      else if (c.type === "date") cell.numFmt = "dd/mm/yyyy";
      else if (c.type === "percent") cell.numFmt = "0.00%";
      else if (c.type === "number") cell.numFmt = "#,##0.00";
    });
  }

  // Auto-filter no header
  if (rows.length > 0) {
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Headers HTTP padrao para download de xlsx. */
export function xlsxHeaders(filename: string): HeadersInit {
  return {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}
