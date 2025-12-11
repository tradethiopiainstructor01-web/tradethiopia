const calculateCommission = (salesValue = 0) => {
  const commissionRate = 0.07;
  const taxRate = 0.00075;

  const price = Number(salesValue) || 0;
  const grossCommission = price * commissionRate;
  const commissionTax = grossCommission * taxRate;
  const netCommission = grossCommission - commissionTax;

  return {
    grossCommission: Number(grossCommission.toFixed(2)),
    commissionTax: Number(commissionTax.toFixed(2)),
    netCommission: Number(netCommission.toFixed(2)),
  };
};

module.exports = {
  calculateCommission,
};
