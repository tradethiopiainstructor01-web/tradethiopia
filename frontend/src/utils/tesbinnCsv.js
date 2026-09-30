export const readTrainingImportRows = async (file) => {
  if (/\.csv$/i.test(file.name)) return parseCsvRows(await file.text());
  if (!/\.xlsx?$/i.test(file.name)) {
    throw new Error("Select a CSV or Excel (.xlsx or .xls) file.");
  }
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  // Formatted strings retain phone number formatting and convert Excel dates.
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1, raw: false, defval: '', blankrows: true, range: 0,
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

export const prepareTrainingImport = (rows) => {
  const headerIndex = rows.findIndex((row) => row.some((value) => String(value ?? '').trim()));
  if (headerIndex === -1) return { payloads: [], skippedRows: [] };
  const headers = rows[headerIndex].map(normalizeCsvHeader);
  const nameHeaders = ['customername', 'customer', 'fullname', 'name', 'studentname'];
  if (!headers.some((header) => nameHeaders.includes(header))) {
    throw new Error('Use a Customer Name, Full Name, or Name column in the first row of your file.');
  }
  const payloads = [];
  const skippedRows = [];
  rows.slice(headerIndex + 1).forEach((row, index) => {
    if (!row.some((value) => String(value ?? '').trim())) return;
    const record = Object.fromEntries(headers.map((header, column) => [header, String(row[column] ?? '')]));
    const payload = buildTrainingFollowupPayloadFromCsvRecord(record);
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

export const buildTrainingFollowupPayloadFromCsvRecord = (record) => {
  const batchValue = getCsvRecordValue(record, ["batch", "group", "batchgroup"]);
  const payload = {
    customerName: getCsvRecordValue(record, ["customername", "customer", "fullname", "name", "studentname"]),
    email: getCsvRecordValue(record, ["email"]),
    phoneNumber: getCsvRecordValue(record, ["phonenumber", "phone", "mobile"]),
    trainingType: getCsvRecordValue(record, ["course", "trainingtype", "trainingcourse"]),
    scheduleShift: getCsvRecordValue(record, ["schedule", "scheduleshift", "trainingschedule"]),
    agentName: getCsvRecordValue(record, ["agent", "agentname"]),
    salesAgent: getCsvRecordValue(record, ["agent", "agentname"]),
    assignedInstructor: getCsvRecordValue(record, ["instructor", "assignedinstructor"]),
    progress: getCsvRecordValue(record, ["progress"]) || "Completed",
    materialStatus: getCsvRecordValue(record, ["materialstatus"]) || "Not Delivered",
  };
  if (batchValue) {
    payload.batch = batchValue;
  }

  const startDate = getCsvRecordValue(record, ["startdate"]);
  const endDate = getCsvRecordValue(record, ["enddate"]);
  const parsedStart = parseCsvDate(startDate);
  const parsedEnd = parseCsvDate(endDate);
  if (parsedStart) payload.startDate = parsedStart;
  if (parsedEnd) payload.endDate = parsedEnd;

  return payload;
};

