const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');

router.use(protect);

router.get('/', requireMinRole('hod'), getAuditLogs);

module.exports = router;

