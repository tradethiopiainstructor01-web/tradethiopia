const LeadInternationalRecord = require('../models/LeadInternationalRecord');

const FRONTEND_COLUMNS = [
  'Months',
  'OFFICE',
  'REGDATE',
  'ASSDATE',
  'LEAD_TYPE',
  'ROLE',
  'EXPTRADER',
  'BUYER',
  'PRODUCT',
  'EMAIL',
  'PHONE',
  'WEBSITE',
  'HS',
  'HSDSC',
  'CAT_COD',
  'COMERCIALDSC',
  'GWEIGHT',
  'NWEIGHT',
  'FOB_VALUE_IN_USD',
  'FOB_VALUE_IN_BIRR',
  'QTY',
  'UNIT_',
  'CDESTINATION',
];

const HEADER_ALIASES = {
  MONTH: 'months',
  MONTHS: 'months',
  OFFICE: 'office',
  REGDATE: 'regDate',
  ASSDATE: 'assDate',
  LEADTYPE: 'leadType',
  TYPE: 'leadType',
  LEADSCOPE: 'leadType',
  ROLE: 'role',
  BYER: 'role',
  EXPTRADER: 'expTrader',
  EXPORTER: 'expTrader',
  BUYER: 'buyer',
  PRODUCT: 'product',
  PRODUCTNAME: 'product',
  ITEM: 'product',
  EMAIL: 'email',
  MAIL: 'email',
  BUYEREMAIL: 'email',
  PHONE: 'phone',
  TELEPHONE: 'phone',
  TEL: 'phone',
  CONTACTPHONE: 'phone',
  WEBSITE: 'website',
  WEB: 'website',
  URL: 'website',
  SITE: 'website',
  HS: 'hs',
  HSDSC: 'hsDsc',
  HSDESC: 'hsDsc',
  CATCOD: 'catCod',
  CATEGORYCODE: 'catCod',
  CATEGORY: 'catCod',
  COMERCIALDSC: 'comercialDsc',
  COMMERCIALDSC: 'comercialDsc',
  GWEIGHT: 'gWeight',
  GROSSWEIGHT: 'gWeight',
  NWEIGHT: 'nWeight',
  NETWEIGHT: 'nWeight',
  FOBVALUEINUSD: 'fobValueInUsd',
  FOBVALUEUSD: 'fobValueInUsd',
  FOBVALUEINBIRR: 'fobValueInBirr',
  FOBVALUEBIRR: 'fobValueInBirr',
  QTY: 'qty',
  QUANTITY: 'qty',
  UNIT: 'unit',
  UNIT_: 'unit',
  CDESTINATION: 'cDestination',
  DESTINATION: 'cDestination',
};

const normalizeHeader = (value = '') =>
  String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const normalizeCell = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeLeadType = (value) => {
  const cleaned = normalizeCell(value).toLowerCase();
  if (cleaned === 'local') return 'Local';
  if (cleaned === 'international' || cleaned === 'intl') return 'International';
  return '';
};

const toFrontendRow = (record = {}) => ({
  _id: record._id,
  Months: record.months || '',
  OFFICE: record.office || '',
  REGDATE: record.regDate || '',
  ASSDATE: record.assDate || '',
  LEAD_TYPE: record.leadType || '',
  ROLE: record.role || '',
  EXPTRADER: record.expTrader || '',
  BUYER: record.buyer || '',
  PRODUCT: record.product || '',
  EMAIL: record.email || '',
  PHONE: record.phone || '',
  WEBSITE: record.website || '',
  HS: record.hs || '',
  HSDSC: record.hsDsc || '',
  CAT_COD: record.catCod || '',
  COMERCIALDSC: record.comercialDsc || '',
  GWEIGHT: record.gWeight || '',
  NWEIGHT: record.nWeight || '',
  FOB_VALUE_IN_USD: record.fobValueInUsd || '',
  FOB_VALUE_IN_BIRR: record.fobValueInBirr || '',
  QTY: record.qty || '',
  UNIT_: record.unit || '',
  CDESTINATION: record.cDestination || '',
});

const mapIncomingRow = (row = {}) => {
  const mapped = {
    months: '',
    office: '',
    regDate: '',
    assDate: '',
    leadType: '',
    role: '',
    expTrader: '',
    buyer: '',
    product: '',
    email: '',
    phone: '',
    website: '',
    hs: '',
    hsDsc: '',
    catCod: '',
    comercialDsc: '',
    gWeight: '',
    nWeight: '',
    fobValueInUsd: '',
    fobValueInBirr: '',
    qty: '',
    unit: '',
    cDestination: '',
  };

  Object.entries(row || {}).forEach(([key, value]) => {
    const normalized = normalizeHeader(key);
    const field = HEADER_ALIASES[normalized];
    if (!field) return;
    mapped[field] = normalizeCell(value);
  });

  mapped.leadType = normalizeLeadType(mapped.leadType);

  const hasAnyValue = Object.values(mapped).some((value) => value !== '');
  return hasAnyValue ? mapped : null;
};

const importLeadInternationalRecords = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const replaceExisting = req.body?.replaceExisting !== false;
    const replaceScope = normalizeCell(req.body?.replaceScope).toLowerCase();
    const requestedLeadType = normalizeLeadType(req.body?.leadType);

    if (!rows.length) {
      return res.status(400).json({ error: 'rows must be a non-empty array.' });
    }

    const mappedRows = rows
      .map(mapIncomingRow)
      .filter(Boolean)
      .map((row) => ({
        ...row,
        leadType: requestedLeadType || row.leadType,
      }));
    if (!mappedRows.length) {
      return res.status(400).json({ error: 'No valid lead international rows were provided.' });
    }

    if (replaceExisting) {
      if (replaceScope === 'leadtype') {
        const targetLeadType = requestedLeadType || mappedRows[0]?.leadType || '';
        if (!targetLeadType) {
          return res.status(400).json({
            error: 'leadType is required when replaceScope is "leadType".',
          });
        }
        await LeadInternationalRecord.deleteMany({
          leadType: { $regex: `^${targetLeadType}$`, $options: 'i' },
        });
      } else {
        await LeadInternationalRecord.deleteMany({});
      }
    }

    await LeadInternationalRecord.insertMany(mappedRows, { ordered: false });
    const savedRows = await LeadInternationalRecord.find().sort({ createdAt: -1 });

    return res.status(201).json({
      importedCount: mappedRows.length,
      totalCount: savedRows.length,
      columns: FRONTEND_COLUMNS,
      records: savedRows.map((record) => toFrontendRow(record.toObject())),
    });
  } catch (error) {
    console.error('Lead international import failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to import lead international rows.' });
  }
};

const createLeadInternationalRecord = async (req, res) => {
  try {
    const candidateRow =
      req.body && typeof req.body === 'object' && req.body.row && typeof req.body.row === 'object'
        ? req.body.row
        : req.body;

    const mappedRow = mapIncomingRow(candidateRow);
    if (!mappedRow) {
      return res.status(400).json({ error: 'No valid lead international row was provided.' });
    }

    const created = await LeadInternationalRecord.create(mappedRow);
    return res.status(201).json({
      record: toFrontendRow(created.toObject()),
    });
  } catch (error) {
    console.error('Lead international create failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to create lead international row.' });
  }
};

const updateLeadInternationalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateRow =
      req.body && typeof req.body === 'object' && req.body.row && typeof req.body.row === 'object'
        ? req.body.row
        : req.body;

    const mappedRow = mapIncomingRow(candidateRow);
    if (!mappedRow) {
      return res.status(400).json({ error: 'No valid lead international row was provided.' });
    }

    const updated = await LeadInternationalRecord.findByIdAndUpdate(id, mappedRow, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Lead international row not found.' });
    }

    return res.status(200).json({
      record: toFrontendRow(updated.toObject()),
    });
  } catch (error) {
    console.error('Lead international update failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to update lead international row.' });
  }
};

const deleteLeadInternationalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LeadInternationalRecord.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Lead international row not found.' });
    }

    return res.status(200).json({ message: 'Lead international row deleted successfully.' });
  } catch (error) {
    console.error('Lead international delete failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete lead international row.' });
  }
};

const getLeadInternationalRecords = async (req, res) => {
  try {
    const records = await LeadInternationalRecord.find().sort({ createdAt: -1 });
    return res.status(200).json({
      totalCount: records.length,
      columns: FRONTEND_COLUMNS,
      records: records.map((record) => toFrontendRow(record.toObject())),
    });
  } catch (error) {
    console.error('Failed to fetch lead international records:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch lead international rows.' });
  }
};

module.exports = {
  importLeadInternationalRecords,
  createLeadInternationalRecord,
  updateLeadInternationalRecord,
  deleteLeadInternationalRecord,
  getLeadInternationalRecords,
};
