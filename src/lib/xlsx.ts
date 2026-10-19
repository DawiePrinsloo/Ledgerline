/**
 * A dependency-free XLSX writer.
 *
 * An .xlsx file is a ZIP archive of XML parts. Building it here (rather than
 * pulling in a spreadsheet library) keeps the offline bundle tiny and means
 * the export works with no network at all.
 *
 * Supports multiple sheets, inline strings, bold headers and currency number
 * formats. Compression is "stored" (none), which every spreadsheet app reads.
 */

export interface Cell {
  value: string | number;
  bold?: boolean;
  /** 164 = currency, 165 = signed currency. See STYLES below. */
  money?: boolean;
  signed?: boolean;
}

export type Row = Cell[];
export interface Sheet {
  name: string;
  rows: Row[];
  /** Approximate column widths, in Excel character units. */
  widths?: number[];
}

/* ── CRC-32 ─────────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/* ── ZIP (stored, no compression) ──────────────────────────────────── */

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  offset: number;
}

function dosDateTime(): { time: number; date: number } {
  // Fixed timestamp keeps generated files byte-identical for the same data.
  return { time: (12 << 11) | (0 << 5) | 0, date: ((2026 - 1980) << 9) | (1 << 5) | 1 };
}

function buildZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime();
  const locals: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true); // local file header signature
    header.setUint16(4, 20, true); // version needed
    header.setUint16(6, 0x0800, true); // UTF-8 filename flag
    header.setUint16(8, 0, true); // stored
    header.setUint16(10, time, true);
    header.setUint16(12, date, true);
    header.setUint32(14, crc, true);
    header.setUint32(18, data.length, true); // compressed size
    header.setUint32(22, data.length, true); // uncompressed size
    header.setUint16(26, nameBytes.length, true);
    header.setUint16(28, 0, true); // extra length

    const chunk = new Uint8Array(30 + nameBytes.length + data.length);
    chunk.set(new Uint8Array(header.buffer), 0);
    chunk.set(nameBytes, 30);
    chunk.set(data, 30 + nameBytes.length);
    locals.push(chunk);

    entries.push({ name: file.name, data, crc, offset });
    offset += chunk.length;
  }

  // Central directory
  const centrals: Uint8Array[] = [];
  let centralSize = 0;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true); // central directory signature
    dir.setUint16(4, 20, true); // version made by
    dir.setUint16(6, 20, true); // version needed
    dir.setUint16(8, 0x0800, true); // UTF-8 flag
    dir.setUint16(10, 0, true); // stored
    dir.setUint16(12, time, true);
    dir.setUint16(14, date, true);
    dir.setUint32(16, entry.crc, true);
    dir.setUint32(20, entry.data.length, true);
    dir.setUint32(24, entry.data.length, true);
    dir.setUint16(28, nameBytes.length, true);
    dir.setUint16(30, 0, true); // extra
    dir.setUint16(32, 0, true); // comment
    dir.setUint16(34, 0, true); // disk number
    dir.setUint16(36, 0, true); // internal attributes
    dir.setUint32(38, 0, true); // external attributes
    dir.setUint32(42, entry.offset, true);

    const chunk = new Uint8Array(46 + nameBytes.length);
    chunk.set(new Uint8Array(dir.buffer), 0);
    chunk.set(nameBytes, 46);
    centrals.push(chunk);
    centralSize += chunk.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // end of central directory
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  end.setUint16(20, 0, true); // comment length

  const total = offset + centralSize + 22;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of locals) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  for (const chunk of centrals) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  out.set(new Uint8Array(end.buffer), cursor);
  return out;
}

/* ── XML helpers ────────────────────────────────────────────────────── */

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnLetter(index: number): string {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

/** Style indexes — must match the cellXfs order in STYLES. */
const S_DEFAULT = 0;
const S_BOLD = 1;
const S_MONEY = 2;
const S_SIGNED = 3;

function styleFor(cell: Cell): number {
  if (cell.signed) return S_SIGNED;
  if (cell.money) return S_MONEY;
  if (cell.bold) return S_BOLD;
  return S_DEFAULT;
}

function sheetXml(sheet: Sheet): string {
  const rowsXml = sheet.rows
    .map((row, r) => {
      const index = r + 1;
      const cells = row
        .map((cell, c) => {
          const ref = `${columnLetter(c)}${index}`;
          const style = styleFor(cell);
          const s = style === S_DEFAULT ? "" : ` s="${style}"`;
          if (typeof cell.value === "number") {
            return `<c r="${ref}"${s}><v>${cell.value}</v></c>`;
          }
          const text = xmlEscape(cell.value);
          if (!text) return `<c r="${ref}"${s}/>`;
          return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${index}">${cells}</row>`;
    })
    .join("");

  const cols = sheet.widths
    ? `<cols>${sheet.widths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    cols +
    `<sheetData>${rowsXml}</sheetData>` +
    `</worksheet>`
  );
}

const STYLES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="2">` +
  `<numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/>` +
  `<numFmt numFmtId="165" formatCode="+&quot;$&quot;#,##0.00;-&quot;$&quot;#,##0.00"/>` +
  `</numFmts>` +
  `<fonts count="2">` +
  `<font><sz val="11"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><name val="Calibri"/></font>` +
  `</fonts>` +
  `<fills count="2">` +
  `<fill><patternFill patternType="none"/></fill>` +
  `<fill><patternFill patternType="gray125"/></fill>` +
  `</fills>` +
  `<borders count="1"><border/></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `</cellXfs>` +
  `</styleSheet>`;

/** Build a multi-sheet .xlsx workbook as a Blob. */
export function buildXlsx(sheets: Sheet[]): Blob {
  const files: Array<{ name: string; content: string }> = [
    {
      name: "[Content_Types].xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        sheets
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
          )
          .join("") +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      name: "_rels/.rels",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>` +
        sheets
          .map(
            (sheet, i) =>
              `<sheet name="${xmlEscape(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
          )
          .join("") +
        `</sheets>` +
        `</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        sheets
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
          )
          .join("") +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    { name: "xl/styles.xml", content: STYLES },
    ...sheets.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      content: sheetXml(sheet),
    })),
  ];

  const bytes = buildZip(files);
  // Copy into a fresh ArrayBuffer so the Blob part is a plain ArrayBuffer.
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
