const express = require('express');
const router = express.Router();
const {
  getApprovals,
  getApprovalById,
  reviewApproval,
} = require('../controllers/approvalController');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');

router.use(protect);

router.get('/', getApprovals);
router.get('/:id', getApprovalById);
router.post('/:id/review', requireMinRole('hod'), reviewApproval);

module.exports = router;

