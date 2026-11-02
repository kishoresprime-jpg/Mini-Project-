const express = require('express');
const router = express.Router();
const { getReportSummary, exportCsv } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');

router.use(protect);

router.get('/summary', getReportSummary);
router.get('/export-csv', requireMinRole('faculty'), exportCsv);

module.exports = router;

