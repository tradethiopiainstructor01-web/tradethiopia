const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const controller = require('../controllers/customerDepartmentKpiController');
router.use(protect);
router.get('/', authorize('customerservice', 'CustomerSuccessManager', 'COO', 'CEO'), controller.getReport);
router.post('/', authorize('customerservice', 'CustomerSuccessManager'), controller.submitReport);
module.exports = router;
