const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  addStageToWorkflow,
  deleteWorkflow,
} = require('../controllers/workflowController');
const { protect } = require('../middleware/auth');
const { requireMinRole, authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', getWorkflows);
router.get('/:id', getWorkflowById);
router.post('/', requireMinRole('hod'), createWorkflow);
router.post('/:id/stages', requireMinRole('hod'), addStageToWorkflow);
router.delete('/:id', authorize('super_admin', 'principal', 'hod'), deleteWorkflow);

module.exports = router;

