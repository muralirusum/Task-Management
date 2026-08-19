const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  submitTask,
  addComment,
  updateDeadline,
  reassignTask,
} = require('../controllers/taskController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id/status', updateTaskStatus);
router.post('/:id/submit', submitTask);
router.post('/:id/comments', addComment);
router.put('/:id/deadline', updateDeadline);
router.put('/:id/reassign', reassignTask);

module.exports = router;
