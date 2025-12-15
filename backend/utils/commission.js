const calculateCommission = (salesValue = 0) => {
  const commissionRate = 0.075;
  
  const price = Number(salesValue) || 0;
  
  // Adjust SocialTaxRate based on price
  const SocialtaxRate = price < 15000 ? 300 : 900;
  const Commission = price - SocialtaxRate
  const grossCommission = Commission * commissionRate;
  const commissionTax = SocialtaxRate;
  const netCommission = grossCommission;

  return {
    grossCommission: Number(grossCommission.toFixed(2)),
    commissionTax: Number(commissionTax.toFixed(2)),
    netCommission: Number(netCommission.toFixed(2)),
  };
};

const resolveSaleCommission = (sale) => {
  if (sale?.commission && typeof sale.commission === 'object') {
    const {
      grossCommission = 0,
      commissionTax = 0,
      netCommission = 0
    } = sale.commission;

    if (typeof netCommission === 'number') {
      return {
        grossCommission,
        commissionTax,
        netCommission
      };
    }
  }

  return calculateCommission(sale?.coursePrice || 0);
};

module.exports = {
  calculateCommission,
  resolveSaleCommission
};
