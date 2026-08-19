const express = require('express');
const router = express.Router();
const {
  getDailyWork,
  createDailyWork,
  deleteDailyWork,
} = require('../controllers/dailyWorkController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', getDailyWork);
router.post('/', createDailyWork);
router.delete('/:id', deleteDailyWork);

module.exports = router;
