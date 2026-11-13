const router = require('express').Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/ecommerceTableController');

router.use(protect);
router.get('/manager/:channel', controller.managerList);
router.get('/manager/:channel/:id', controller.managerGet);
router.get('/:channel/folders', controller.listFolders);
router.post('/:channel/folders', controller.createFolder);
router.get('/:channel', controller.list);
router.post('/:channel/import', controller.importRows);
router.get('/:channel/:id', controller.get);
router.patch('/:channel/:id/columns/:columnIndex', controller.setColumnArchived);
router.post('/:channel/:id/remove-duplicates', controller.removeDuplicates);
router.delete('/:channel', controller.removeAll);
router.delete('/:channel/:id', controller.remove);
router.put('/:channel/:id/rows/:rowId', controller.updateRow);

module.exports = router;
