// Every spreadsheet format SheetJS can read; used for file inputs and validation.
export const SPREADSHEET_EXTENSIONS = [
  '.xlsx', '.xlsm', '.xlsb', '.xls', '.xltx', '.xltm', '.xlt',
  '.ods', '.fods', '.csv', '.tsv', '.txt', '.xml', '.numbers',
];
export const SPREADSHEET_ACCEPT = [
  ...SPREADSHEET_EXTENSIONS,
  'text/csv',
  'text/tab-separated-values',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.oasis.opendocument.spreadsheet',
].join(',');

export const isSpreadsheetFile = (file) => {
  const name = (file?.name || '').toLowerCase();
  return SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext));
};

export const readTrainingImportRows = async (file) => {
  // Plain CSV keeps the custom parser so phone numbers keep leading zeros.
  if (/\.csv$/i.test(file.name)) return parseCsvRows(await file.text());
  if (!isSpreadsheetFile(file)) {
    throw new Error("Select an Excel or spreadsheet file (.xlsx, .xls, .xlsm, .xlsb, .ods, .csv, .tsv).");
  }
  const XLSX = await import('xlsx');
  const workbook = /\.(tsv|txt)$/i.test(file.name)
    ? XLSX.read(await file.text(), { type: 'string', FS: '\t', raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  // Use the first sheet that contains any cells.
  const sheetName = workbook.SheetNames.find((name) => workbook.Sheets[name]?.['!ref'])
    || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  // Formatted strings retain phone number formatting and convert Excel dates.
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1, raw: false, defval: '', blankrows: true, range: 0, dateNF: 'yyyy-mm-dd',
  });
};

export const parseCsvRows = (text) => {
  const rows = [];
  let current = "";
  let inQuotes = false;
  let row = [];

  const pushCell = () => {
    row.push(current);
    current = "";
  };

  const pushRow = () => {
    if (row.length) {
      rows.push(row);
      row = [];
    }
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      pushCell();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      pushCell();
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      pushRow();
      continue;
    }

    current += char;
  }

  if (inQuotes) throw new Error("The CSV contains an unclosed quoted field.");

  if (current || row.length) {
    pushCell();
    pushRow();
  }

  return rows;
};

export const normalizeCsvHeader = (value) =>
  value?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "";

const NAME_HEADERS = ['customername', 'customer', 'fullname', 'name', 'studentname', 'clientname', 'traineename'];

export const prepareTrainingImport = (rows, { defaultProgress = 'Completed' } = {}) => {
  const headerIndex = rows.findIndex((row) => row.some((value) => String(value ?? '').trim()));
  if (headerIndex === -1) return { payloads: [], skippedRows: [] };
  const headers = rows[headerIndex].map(normalizeCsvHeader);
  const nameHeaders = NAME_HEADERS;
  if (!headers.some((header) => nameHeaders.includes(header))) {
    throw new Error('Use a Customer Name, Full Name, or Name column in the first row of your file.');
  }
  const payloads = [];
  const skippedRows = [];
  rows.slice(headerIndex + 1).forEach((row, index) => {
    if (!row.some((value) => String(value ?? '').trim())) return;
    const record = Object.fromEntries(headers.map((header, column) => [header, String(row[column] ?? '')]));
    const payload = buildTrainingFollowupPayloadFromCsvRecord(record, { defaultProgress });
    if (!payload.customerName) skippedRows.push(headerIndex + index + 2);
    else payloads.push(payload);
  });
  return { payloads, skippedRows };
};

const getCsvRecordValue = (record, keys = []) => {
  for (const key of keys) {
    if (record[key]) {
      const trimmed = record[key].trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
};

const parseCsvDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

export const buildTrainingFollowupPayloadFromCsvRecord = (record, { defaultProgress = "Completed" } = {}) => {
  const batchValue = getCsvRecordValue(record, ["batch", "group", "batchgroup"]);
  const payload = {
    customerName: getCsvRecordValue(record, NAME_HEADERS),
    email: getCsvRecordValue(record, ["email", "emailaddress"]),
    phoneNumber: getCsvRecordValue(record, ["phonenumber", "phone", "mobile", "phoneno", "telephone"]),
    trainingType: getCsvRecordValue(record, ["course", "trainingtype", "trainingcourse", "training", "program"]),
    scheduleShift: getCsvRecordValue(record, ["schedule", "scheduleshift", "trainingschedule", "shift"]),
    fieldOfWork: getCsvRecordValue(record, ["fieldofwork", "field", "profession"]),
    agentName: getCsvRecordValue(record, ["agent", "agentname"]),
    salesAgent: getCsvRecordValue(record, ["salesagent", "agent", "agentname"]),
    assignedInstructor: getCsvRecordValue(record, ["instructor", "assignedinstructor"]),
    progress: getCsvRecordValue(record, ["progress"]) || defaultProgress,
    materialStatus: getCsvRecordValue(record, ["materialstatus", "material"]) || "Not Delivered",
  };
  if (batchValue) {
    payload.batch = batchValue;
  }
  const startTime = getCsvRecordValue(record, ["starttime"]);
  const endTime = getCsvRecordValue(record, ["endtime"]);
  if (startTime) payload.startTime = startTime;
  if (endTime) payload.endTime = endTime;

  const startDate = getCsvRecordValue(record, ["startdate", "trainingstartdate"]);
  const endDate = getCsvRecordValue(record, ["enddate", "trainingenddate"]);
  const parsedStart = parseCsvDate(startDate);
  const parsedEnd = parseCsvDate(endDate);
  if (parsedStart) payload.startDate = parsedStart;
  if (parsedEnd) payload.endDate = parsedEnd;

  return payload;
};

