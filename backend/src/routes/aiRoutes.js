const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  applyRecommendation,
  getWorkloadDashboard,
  getDelayRiskDashboard,
  reEvaluateRisks,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');

router.use(protect);

router.post('/recommend-assignees', requireMinRole('faculty'), getRecommendations);
router.post('/apply-recommendation', requireMinRole('faculty'), applyRecommendation);
router.get('/workload-analytics', getWorkloadDashboard);
router.get('/delay-risk-dashboard', getDelayRiskDashboard);
router.post('/re-evaluate-risks', requireMinRole('hod'), reEvaluateRisks);

module.exports = router;

