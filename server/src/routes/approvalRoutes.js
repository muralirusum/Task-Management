const express = require('express');
const router = express.Router();
const {
  getApprovals,
  getPendingApprovals,
  middlePersonApprove,
  mainPersonApprove,
  rejectTask,
} = require('../controllers/approvalController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', getApprovals);
router.get('/pending', getPendingApprovals);
router.post('/:taskId/middle-approve', authorizeRoles('manager', 'ceo', 'middle', 'main'), middlePersonApprove);
router.post('/:taskId/main-approve', authorizeRoles('ceo', 'main'), mainPersonApprove);
router.post('/:taskId/reject', authorizeRoles('manager', 'ceo', 'middle', 'main'), rejectTask);

module.exports = router;
