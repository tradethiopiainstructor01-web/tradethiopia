const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const User = require('../models/user.model.js');

const buildPackageRows = (customers, customerType, agentLookup = {}) => {
  const rows = [];

  const createRow = (customer, pkg, fallbackLabel = 'Package') => {
    const packageType = pkg?.packageType || customer.packageType || 'Not specified';
    const packageName = pkg?.packageName
      || (pkg?.packageType ? `${fallbackLabel} ${pkg.packageType}` : null)
      || (customer.packageType ? `${fallbackLabel} ${customer.packageType}` : `${fallbackLabel}`);

    return {
      id: `${customer._id}-${pkg?._id || 'default'}`,
      customerId: customer._id,
      customerName: customer.companyName || customer.contactPerson || 'Unknown',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phoneNumber || '',
      agent: agentLookup[customer.agentId?.toString?.()] || 'Unassigned',
      agentId: customer.agentId ? customer.agentId.toString() : null,
      customerType,
      packageId: pkg?._id || null,
      packageName,
      packageType,
      country: customer.country || 'Not specified',
      industry: customer.industry || 'Not specified',
      purchaseDate: pkg?.purchaseDate || customer.createdAt,
      expiryDate: pkg?.expiryDate || null,
      status: pkg?.status || 'Active',
    };
  };

  customers.forEach((customer) => {
    const packages = Array.isArray(customer.packages) ? customer.packages : [];
    if (packages.length === 0) {
      if (customer.packageType) {
        rows.push(createRow(customer, null));
      }
      return;
    }

    packages.forEach((pkg) => {
      rows.push(createRow(customer, pkg));
    });
  });

  return rows;
};

const getPackageSales = async (_req, res) => {
  try {
    const buyers = await Buyer.find()
      .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId');
    const sellers = await Seller.find()
      .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId');

    const agentIds = [
      ...new Set(
        [...buyers, ...sellers]
          .map(customer => customer.agentId)
          .filter(Boolean)
          .map(id => id.toString())
      )
    ];

    const agents = await User.find({ _id: { $in: agentIds } }).select('fullName username');
    const agentLookup = agents.reduce((acc, agent) => {
      acc[agent._id.toString()] = agent.fullName || agent.username || 'Agent';
      return acc;
    }, {});

    const packageRows = [
      ...buildPackageRows(buyers, 'Buyer', agentLookup),
      ...buildPackageRows(sellers, 'Seller', agentLookup),
    ];

    const sortedRows = packageRows.sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
      const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
      return dateB - dateA;
    });

    res.json(sortedRows);
  } catch (err) {
    console.error('Failed to load package sales:', err);
    res.status(500).json({ message: err.message });
  }
};

const approveCommission = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { agentId, firstCommission, secondCommission } = req.body;
    
    // In a real implementation, you would:
    // 1. Validate the commission data
    // 2. Update the commission status in the database
    // 3. Add the commission amounts to the payroll system
    
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: 'Commission approved and added to payroll',
      commissionId,
      agentId,
      firstCommission,
      secondCommission
    });
  } catch (err) {
    console.error('Failed to approve commission:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPackageSales,
  approveCommission
};
