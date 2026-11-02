const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize, requireMinRole } = require('../middleware/rbac');

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', requireMinRole('hod'), createUser);
router.put('/:id', requireMinRole('hod'), updateUser);
router.patch('/:id/toggle-status', requireMinRole('hod'), toggleUserStatus);
router.delete('/:id', authorize('super_admin'), deleteUser);

module.exports = router;

