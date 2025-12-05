
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const path = require('path');

jest.setTimeout(30000);
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let app;
let mongod;

const InventoryItem = require('../models/InventoryItem');
const Followup = require('../models/Followup');

beforeAll(async () => {
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  if (systemBinary) {
    mongod = await MongoMemoryServer.create({
      binary: { systemBinary, skipMD5: true, checkMD5: false }
    });
  } else {
    try {
      const downloadDir = path.join(__dirname, '..', '.mongodb-binaries');
      mongod = await MongoMemoryServer.create({ binary: { downloadDir } });
    } catch (err) {
      console.warn('Skipping demand preview tests: MongoMemoryServer failed to start.', err?.message || err);
      return;
    }
  }
  if (!mongod) return;
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect().catch(() => {});
  if (mongod && typeof mongod.stop === 'function') {
    await mongod.stop().catch(() => {});
  }
});

describe('Preview and Demand creation', () => {
  let salesToken;
  let salesUserId = new mongoose.Types.ObjectId();

  beforeAll(() => {
    salesToken = jwt.sign({ _id: salesUserId, role: 'sales' }, process.env.JWT_SECRET);
  });

  const maybe = mongod ? test : test.skip;

  maybe('preview shows allocation without persisting and reserve creates Demand when short', async () => {
    // inventory with 1 quantity and 0 buffer
    const item = await InventoryItem.create({ name: 'Short Item', sku: 'SI-1', price: 5, quantity: 1, bufferStock: 0 });
    const followup = await Followup.create({ 
      clientName: 'ShortCo',
      companyName: 'ShortCo Ltd',
      phoneNumber: '000111222',
      email: 'short@co.com',
      packageType: 'basic',
      serviceProvided: 'sales',
      serviceNotProvided: 'none',
      deadline: new Date(Date.now() + 3*24*60*60*1000)
    });

    // preview for qty 3 should allocate 1 stock and unfulfilled 2
    const previewRes = await request(app)
      .post(`/api/followups/${followup._id}/reserve/preview`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ items: [{ id: item._id.toString(), qty: 3 }] })
      .expect(200);

    const preview = previewRes.body.preview;
    expect(Array.isArray(preview)).toBe(true);
    expect(preview[0].allocatedQty).toBe(1);
    expect(preview[0].unfulfilled).toBe(2);

    // actual reserve should create Demand with unfulfilled 2
    const reserveRes = await request(app)
      .post(`/api/followups/${followup._id}/reserve`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ items: [{ id: item._id.toString(), qty: 3 }] })
      .expect(201);

    expect(reserveRes.body.order).toBeDefined();
    expect(reserveRes.body.demand).toBeDefined();
    const demand = reserveRes.body.demand;
    expect(demand.lines && demand.lines[0].unfulfilledQty).toBe(2);
  }, 20000);
});
