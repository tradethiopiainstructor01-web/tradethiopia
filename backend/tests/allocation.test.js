const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const path = require('path');

// increase default timeout to allow binary download on slow networks
jest.setTimeout(30000);

// ensure JWT_SECRET is available early
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let app;
let mongod;
let server;

const InventoryItem = require('../models/InventoryItem');
const Followup = require('../models/Followup');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

beforeAll(async () => {
  // use a project-local binary cache to avoid global lockfile issues
  const downloadDir = path.join(__dirname, '..', '.mongodb-binaries');
  mongod = await MongoMemoryServer.create({ binary: { downloadDir } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // require app after setting env
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod && typeof mongod.stop === 'function') {
    await mongod.stop();
  }
});

describe('Allocation / Reservation / Fulfillment / Payment flows', () => {
  let salesToken;
  let financeToken;
  let salesUserId = new mongoose.Types.ObjectId();
  let financeUserId = new mongoose.Types.ObjectId();

  beforeAll(() => {
    // create tokens with roles and user ids
    salesToken = jwt.sign({ _id: salesUserId, role: 'sales' }, process.env.JWT_SECRET);
    financeToken = jwt.sign({ _id: financeUserId, role: 'finance' }, process.env.JWT_SECRET);
  });

  test('reserve and fulfill flow', async () => {
    // create inventory item with quantity 5 and buffer 2
    const item = await InventoryItem.create({ name: 'Test Item', sku: 'TI-1', price: 10, quantity: 5, bufferStock: 2 });

    // create followup (provide required fields)
    const followup = await Followup.create({ 
      clientName: 'Acme', 
      companyName: 'Acme Co',
      phoneNumber: '1234567890',
      email: 'a@b.com', 
      packageType: 'standard',
      serviceProvided: 'consulting',
      serviceNotProvided: 'none',
      deadline: new Date(Date.now() + 7*24*60*60*1000),
      createdBy: salesUserId 
    });

    // reserve 6 units -> should allocate 5 from stock and 1 from buffer
    const reserveRes = await request(app)
      .post(`/api/followups/${followup._id}/reserve`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ items: [{ id: item._id.toString(), qty: 6 }] })
      .expect(201);

    expect(reserveRes.body.order).toBeDefined();
    const order = reserveRes.body.order;
    expect(order.lines.length).toBeGreaterThan(0);
    const line = order.lines[0];
    expect(line.allocatedQty).toBe(6);
    // demand should be null/undefined (no unfulfilled qty)
    expect(reserveRes.body.demand).toBeFalsy();

    // refresh inventory
    const itemAfterReserve = await InventoryItem.findById(item._id);
    expect(itemAfterReserve.reservedQuantity).toBe(5);
    expect(itemAfterReserve.reservedBuffer).toBe(1);
    expect(itemAfterReserve.bufferStock).toBe(1); // buffer decreased by 1

    // fulfill the order as finance
    const fulfillRes = await request(app)
      .post(`/api/followups/${followup._id}/orders/${order._id}/fulfill`)
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    // after fulfill, inventory quantity should be 0 and reservedQuantity/reservedBuffer 0
    const itemAfterFulfill = await InventoryItem.findById(item._id);
    expect(itemAfterFulfill.quantity).toBe(0);
    expect(itemAfterFulfill.reservedQuantity).toBe(0);
    expect(itemAfterFulfill.reservedBuffer).toBe(0);

    // order status should be fulfilled
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe('fulfilled');

    // create payment for followup
    const payRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ followup: followup._id, method: 'fullpayment', amount: 60, note: 'Paid in full' })
      .expect(201);

    expect(payRes.body._id).toBeDefined();
    const payment = await Payment.findById(payRes.body._id);
    expect(payment.method).toBe('fullpayment');
    expect(payment.amount).toBe(60);
  }, 20000);
});
