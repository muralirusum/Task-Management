const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get chat conversation history between current user and a contact
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { contactId } = req.query;

    if (!contactId) {
      return res.status(400).json({ success: false, message: 'contactId parameter is required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: contactId },
        { senderId: contactId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name role position avatar')
      .populate('receiverId', 'name role position avatar');

    // Mark unread messages from contact as read
    await Message.updateMany(
      { senderId: contactId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat messages',
      error: error.message,
    });
  }
};

// @desc    Get summary of recent conversations (latest message & timestamp per contact)
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    }).sort({ createdAt: -1 });

    const conversations = {};
    messages.forEach((msg) => {
      const otherId =
        msg.senderId.toString() === currentUserId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!conversations[otherId]) {
        conversations[otherId] = {
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unread: msg.receiverId.toString() === currentUserId.toString() && !msg.read,
        };
      }
    });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent conversations',
      error: error.message,
    });
  }
};

// @desc    Send a new chat message to a contact
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, text, attachments } = req.body;

    if (!receiverId || (!text && (!attachments || attachments.length === 0))) {
      return res.status(400).json({
        success: false,
        message: 'receiverId and text/attachments are required',
      });
    }

    const recipient = await User.findById(receiverId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found',
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: (text || '').trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name role position avatar')
      .populate('receiverId', 'name role position avatar');

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send chat message',
      error: error.message,
    });
  }
};

module.exports = {
  getMessages,
  getConversations,
  sendMessage,
};
