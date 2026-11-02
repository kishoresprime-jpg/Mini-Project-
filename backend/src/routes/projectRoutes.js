const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  advanceStage,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { authorize, requireMinRole } = require('../middleware/rbac');

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requireMinRole('faculty'), createProject);
router.put('/:id', requireMinRole('faculty'), updateProject);
router.post('/:id/advance-stage', requireMinRole('hod'), advanceStage);
router.delete('/:id', authorize('super_admin', 'principal', 'hod'), deleteProject);

module.exports = router;

