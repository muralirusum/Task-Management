const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/auth');
const { getMessages, getConversations, sendMessage } = require('../controllers/messageController');

router.use(authenticateUser);

router.get('/', getMessages);
router.get('/conversations', getConversations);
router.post('/', sendMessage);

module.exports = router;
