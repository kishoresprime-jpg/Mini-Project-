const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  submitTaskForReview,
  addSubtask,
  toggleSubtask,
  addComment,
  getComments,
  addAttachment,
  getAttachments,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { requireMinRole, authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', requireMinRole('faculty'), createTask);
router.put('/:id', requireMinRole('faculty'), updateTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/submit', submitTaskForReview);

// Subtasks
router.post('/:id/subtasks', addSubtask);
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);

// Comments
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

// Attachments
router.post('/:id/attachments', addAttachment);
router.get('/:id/attachments', getAttachments);

// Delete
router.delete('/:id', requireMinRole('hod'), deleteTask);

module.exports = router;

