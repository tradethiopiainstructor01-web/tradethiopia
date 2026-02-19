const mongoose = require('mongoose');

const leadInternationalRecordSchema = new mongoose.Schema(
  {
    months: { type: String, default: '' },
    office: { type: String, default: '' },
    regDate: { type: String, default: '' },
    assDate: { type: String, default: '' },
    expTrader: { type: String, default: '' },
    buyer: { type: String, default: '' },
    product: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    hs: { type: String, default: '' },
    hsDsc: { type: String, default: '' },
    catCod: { type: String, default: '' },
    comercialDsc: { type: String, default: '' },
    gWeight: { type: String, default: '' },
    nWeight: { type: String, default: '' },
    fobValueInUsd: { type: String, default: '' },
    fobValueInBirr: { type: String, default: '' },
    qty: { type: String, default: '' },
    unit: { type: String, default: '' },
    cDestination: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LeadInternationalRecord', leadInternationalRecordSchema);
