const express = require('express');
const router = express.Router();
const salesDepartmentKpiController = require('../controllers/salesDepartmentKpiController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

const ALLOWED_ROLES = [
  'salesmanager',
  'admin',
  'coo',
  'COO',
  'coo2',
  'COO2',
  'ceo',
  'CEO',
  'hr',
  'HR',
  'finance',
  'Finance',
];

router.get(
  '/',
  protect,
  authorize(...ALLOWED_ROLES),
  salesDepartmentKpiController.getSalesDepartmentKpis
);

router.post(
  '/',
  protect,
  authorize(...ALLOWED_ROLES),
  salesDepartmentKpiController.saveSalesDepartmentKpi
);

router.get(
  '/live-stats',
  protect,
  authorize(...ALLOWED_ROLES),
  salesDepartmentKpiController.getSalesLiveStats
);

router.get(
  '/live-operational-data',
  protect,
  authorize(...ALLOWED_ROLES),
  salesDepartmentKpiController.getRealSalesOperationalDataEndpoint
);

module.exports = router;
