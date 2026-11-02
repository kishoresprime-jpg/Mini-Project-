const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authorize('super_admin'), createDepartment);
router.put('/:id', authorize('super_admin', 'principal'), updateDepartment);
router.delete('/:id', authorize('super_admin'), deleteDepartment);

module.exports = router;

