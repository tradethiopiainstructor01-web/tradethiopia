const assert = require('assert');
const mongoose = require('mongoose');

const financeErpService = require('../services/financeErpService');
const financePostingService = require('../services/financePostingService');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const BankStatementLine = require('../models/BankStatementLine');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const FiscalPeriod = require('../models/FiscalPeriod');
const InventoryItem = require('../models/InventoryItem');
const Invoice = require('../models/Invoice');
const JournalEntry = require('../models/JournalEntry');
const InventoryMovement = require('../models/InventoryMovement');
const Payment = require('../models/Payment');
const Purchase = require('../models/Purchase');
const Vendor = require('../models/Vendor');

const uri = process.env.FINANCE_E2E_MONGO_URI;

if (!uri) {
  const message = 'FINANCE_E2E_MONGO_URI is required to run the finance rollback E2E test against a Mongo replica set';
  if (process.env.CI) {
    console.error(`not ok - ${message}`);
    process.exit(1);
  }
  console.log(`skip - ${message}`);
  process.exit(0);
}

const userId = new mongoose.Types.ObjectId();
const req = {
  user: { _id: userId, role: 'admin', permissions: ['*'] },
  body: {},
  ip: '127.0.0.1',
  headers: { 'user-agent': 'finance-e2e-test' }
};

const assertTrialBalance = (reports) => {
  const debit = Number(reports.trialBalance.totalDebit.toFixed(2));
  const credit = Number(reports.trialBalance.totalCredit.toFixed(2));
  assert.strictEqual(debit, credit, `trial balance mismatch ${debit} != ${credit}`);
};

const withPatched = async (object, method, replacement, fn) => {
  const original = object[method];
  object[method] = replacement(original);
  try {
    return await fn();
  } finally {
    object[method] = original;
  }
};

const assertNoSalesWorkflowState = async (idempotencyKey, label) => {
  assert.strictEqual(await Invoice.countDocuments({ idempotencyKey }), 0, `${label}: invoice should roll back`);
};

(async () => {
  await mongoose.connect(uri);
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const issueDate = new Date('2026-05-08T00:00:00.000Z');

  try {
    await FiscalPeriod.findOneAndUpdate(
      { name: `E2E ${runId}` },
      {
        name: `E2E ${runId}`,
        periodType: 'monthly',
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T23:59:59.999Z'),
        status: 'open'
      },
      { upsert: true, new: true }
    );

    const customer = await financeErpService.createResource('customers', {
      code: `E2E-CUST-${runId}`,
      name: `E2E Customer ${runId}`
    }, req);

    const invoice = await financeErpService.createResource('invoices', {
      number: `E2E-INV-${runId}`,
      customer: customer._id,
      issueDate,
      dueDate: issueDate,
      items: [{ description: 'E2E sale', quantity: 1, unitPrice: 100, taxRate: 0 }]
    }, req);

    await financeErpService.submitInvoice(invoice._id, req);
    await financeErpService.approveInvoice(invoice._id, req);
    const posted = await financeErpService.postInvoice(invoice._id, req);
    assert.strictEqual(posted.invoice.status, 'posted');
    assert.ok(posted.journalEntry);

    const payment = await financeErpService.createResource('payments', {
      paymentNumber: `E2E-PAY-${runId}`,
      direction: 'inbound',
      partnerType: 'customer',
      customer: customer._id,
      invoice: invoice._id,
      amount: 100,
      method: 'bank',
      status: 'draft',
      paymentDate: issueDate
    }, req);
    const postedPayment = await financeErpService.postPayment(payment._id, req);
    assert.strictEqual(postedPayment.payment.status, 'posted');

    const bankAccount = await financeErpService.createResource('bankAccounts', {
      name: `E2E Bank ${runId}`,
      bankName: 'E2E Bank',
      accountNumber: runId
    }, req);

    const statementResult = await financeErpService.createBankStatement({
      bankAccount: bankAccount._id,
      statementNumber: `E2E-STMT-${runId}`,
      startDate: issueDate,
      endDate: issueDate,
      openingBalance: 0,
      closingBalance: 100,
      lines: [{
        date: issueDate,
        description: 'Customer deposit',
        reference: `E2E-PAY-${runId}`,
        credit: 100,
        amount: 100
      }]
    }, req);

    const reconciliation = await financeErpService.reconcileBank({
      bankStatement: statementResult.statement._id,
      matches: [{
        statementLine: statementResult.lines[0]._id,
        matchedEntityType: 'payment',
        matchedEntityId: payment._id,
        matchedAmount: 100
      }],
      notes: 'E2E reconciliation'
    }, req);
    assert.strictEqual(reconciliation.statement.status, 'reconciled');

    const linkedLine = await BankStatementLine.findById(statementResult.lines[0]._id).lean();
    assert.strictEqual(linkedLine.reconciled, true);
    assert.strictEqual(String(linkedLine.matchedEntityId), String(payment._id));

    await assert.rejects(() => financeErpService.reconcileBank({
      bankStatement: statementResult.statement._id,
      matches: [{
        statementLine: statementResult.lines[0]._id,
        matchedEntityType: 'payment',
        matchedEntityId: payment._id,
        matchedAmount: 100
      }]
    }, req), /already reconciled/);

    const reports = await financeErpService.reports();
    assertTrialBalance(reports);

    const auditCount = await AuditLog.countDocuments({
      entityId: { $in: [invoice._id, statementResult.statement._id] }
    });
    assert.ok(auditCount >= 2, 'expected audit logs for invoice and bank reconciliation');

    const journalCount = await JournalEntry.countDocuments({
      sourceId: { $in: [invoice._id, payment._id] },
      status: 'posted'
    });
    assert.strictEqual(journalCount, 2);

    const purchase = await Purchase.create({
      referenceNumber: `E2E-PO-${runId}`,
      supplier: 'E2E Supplier',
      status: 'received',
      totals: { totalCost: 75 },
      items: [{ item: 'E2E Stock', quantity: 1, unit: 'piece', totalCost: 75 }]
    });
    const purchasePosting = await financeErpService.postInventoryPurchase(purchase._id, req);
    assert.ok(purchasePosting.journalEntry);

    const inventoryItem = await InventoryItem.create({
      name: `E2E Stock ${runId}`,
      sku: `E2E-SKU-${runId}`,
      price: 100,
      quantity: 1
    });
    const movement = await InventoryMovement.create({
      item: inventoryItem._id,
      type: 'deliver',
      amount: 75,
      performedBy: userId
    });
    const cogsPosting = await financeErpService.postInventoryDelivery(movement._id, req);
    assert.ok(cogsPosting.journalEntry);

    const journalFailKey = `rb-journal-${runId}`;
    await withPatched(
      financePostingService,
      'postFromTemplate',
      () => async () => {
        throw new Error('forced journal failure');
      },
      async () => {
        await assert.rejects(() => financeErpService.createSalesWorkflow({
          idempotencyKey: journalFailKey,
          customer: { name: `Rollback Journal Customer ${runId}` },
          salesOrderNumber: `RB-SO-JOURNAL-${runId}`,
          invoice: { number: `RB-INV-JOURNAL-${runId}` },
          items: [{ description: 'Rollback sale', quantity: 1, unitPrice: 9234, taxRate: 0 }],
          payment: { amount: 0, method: 'bank' }
        }, req), /forced journal failure/);
      }
    );
    await assertNoSalesWorkflowState(journalFailKey, 'invoice-created-then-journal-failure');
    assert.strictEqual(await Customer.countDocuments({ name: `Rollback Journal Customer ${runId}` }), 0);
    assert.strictEqual(await JournalEntry.countDocuments({ memo: new RegExp(`RB-INV-JOURNAL-${runId}`) }), 0);

    const cashAccount = await Account.findOne({ code: '1000' });
    assert.ok(cashAccount, 'expected default cash account');
    const ledgerFailKey = `rb-ledger-${runId}`;
    await withPatched(
      Account,
      'updateOne',
      (original) => function patchedUpdateOne(filter, update, options) {
        if (filter?._id && String(filter._id) === String(cashAccount._id)) {
          throw new Error('forced ledger failure');
        }
        return original.call(this, filter, update, options);
      },
      async () => {
        await assert.rejects(() => financeErpService.createSalesWorkflow({
          idempotencyKey: ledgerFailKey,
          customer: { name: `Rollback Ledger Customer ${runId}` },
          salesOrderNumber: `RB-SO-LEDGER-${runId}`,
          invoice: { number: `RB-INV-LEDGER-${runId}` },
          items: [{ description: 'Rollback paid sale', quantity: 1, unitPrice: 3333, taxRate: 0 }],
          payment: { amount: 1111, method: 'bank' }
        }, req), /forced ledger failure/);
      }
    );
    await assertNoSalesWorkflowState(ledgerFailKey, 'payment-created-then-ledger-failure');
    assert.strictEqual(await Customer.countDocuments({ name: `Rollback Ledger Customer ${runId}` }), 0);
    assert.strictEqual(await Payment.countDocuments({ amount: 1111, createdBy: userId }), 0);
    assert.strictEqual(await JournalEntry.countDocuments({ memo: new RegExp(`RB-INV-LEDGER-${runId}`) }), 0);

    const purchaseFailKey = `rb-purchase-${runId}`;
    await withPatched(
      financePostingService,
      'postFromTemplate',
      (original) => async (args) => {
        if (args.templateKey === 'vendor_bill') throw new Error('forced bill journal failure');
        return original(args);
      },
      async () => {
        await assert.rejects(() => financeErpService.createPurchaseWorkflow({
          idempotencyKey: purchaseFailKey,
          vendor: { name: `Rollback Vendor ${runId}` },
          purchaseOrderNumber: `RB-PO-${runId}`,
          bill: { number: `RB-BILL-${runId}` },
          items: [{ description: 'Rollback purchase', quantity: 1, unitPrice: 4444, taxRate: 0 }],
          payment: { amount: 0, method: 'bank' }
        }, req), /forced bill journal failure/);
      }
    );
    assert.strictEqual(await Bill.countDocuments({ idempotencyKey: purchaseFailKey }), 0);
    assert.strictEqual(await Vendor.countDocuments({ name: `Rollback Vendor ${runId}` }), 0);
    assert.strictEqual(await JournalEntry.countDocuments({ memo: new RegExp(`RB-BILL-${runId}`) }), 0);

    const expenseFailKey = `rb-expense-${runId}`;
    await withPatched(
      financePostingService,
      'postFromTemplate',
      (original) => async (args) => {
        if (args.templateKey === 'expense_payment') throw new Error('forced expense payment journal failure');
        return original(args);
      },
      async () => {
        await assert.rejects(() => financeErpService.createExpenseWorkflow({
          idempotencyKey: expenseFailKey,
          number: `RB-EXP-${runId}`,
          category: 'Rollback',
          description: 'Rollback expense',
          amount: 5555,
          paymentMethod: 'cash'
        }, req), /forced expense payment journal failure/);
      }
    );
    assert.strictEqual(await Expense.countDocuments({ idempotencyKey: expenseFailKey }), 0);
    assert.strictEqual(await Payment.countDocuments({ amount: 5555, createdBy: userId }), 0);
    assert.strictEqual(await JournalEntry.countDocuments({ memo: new RegExp(`RB-EXP-${runId}`) }), 0);

    const reversalSource = await financeErpService.createSalesWorkflow({
      idempotencyKey: `rb-reversal-source-${runId}`,
      customer: { name: `Rollback Reversal Customer ${runId}` },
      salesOrderNumber: `RB-SO-REV-SOURCE-${runId}`,
      invoice: { number: `RB-INV-REV-SOURCE-${runId}` },
      items: [{ description: 'Reversal source sale', quantity: 1, unitPrice: 2222, taxRate: 0 }],
      payment: { amount: 0, method: 'bank' }
    }, req);
    const reversalInvoiceId = reversalSource.invoice._id;
    const reversalJournalNumber = reversalSource.journalEntry.number;
    const receivableAccount = await Account.findOne({ code: '1100' });
    const receivableBeforeReversal = receivableAccount.currentBalance;

    await withPatched(
      Account,
      'updateOne',
      (original) => function patchedUpdateOne(filter, update, options) {
        if (update?.$inc?.currentBalance !== undefined) {
          throw new Error('forced reversal ledger failure');
        }
        return original.call(this, filter, update, options);
      },
      async () => {
        await assert.rejects(() => financeErpService.reverseInvoice(reversalInvoiceId, req), /forced reversal ledger failure/);
      }
    );
    const invoiceAfterFailedReversal = await Invoice.findById(reversalInvoiceId).lean();
    const journalAfterFailedReversal = await JournalEntry.findById(reversalSource.journalEntry._id).lean();
    assert.strictEqual(invoiceAfterFailedReversal.status, 'posted');
    assert.strictEqual(journalAfterFailedReversal.status, 'posted');
    assert.strictEqual(await JournalEntry.countDocuments({ memo: new RegExp(`Reversal of ${reversalJournalNumber}`) }), 0);
    assert.strictEqual((await Account.findById(receivableAccount._id)).currentBalance, receivableBeforeReversal);

    console.log('ok - full finance flow: invoice -> approve -> post -> payment -> reconcile -> reports -> audit -> inventory purchase -> COGS');
    console.log('ok - finance rollback safety: sales, purchase, expense, payment ledger, and reversal failures leave no partial state');
  } finally {
    await mongoose.disconnect();
  }
})().catch(async (error) => {
  console.error('not ok - full finance ERP flow');
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
