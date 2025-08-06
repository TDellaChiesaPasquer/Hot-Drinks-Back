var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Conversation = require("../models/conversations");
const { authenticateToken } = require("../modules/jwt");
const { body, validationResult, param } = require("express-validator");
const mongoose = require("mongoose");

router.post('/test', authenticateToken, async (req, res) => {
  const newConversation = new Conversation({
          user1: req.userId,
          user2: new mongoose.Types.ObjectId('68935956d6ad579fd8bb5f84'),
          messageList: []
        })
        const conv = await newConversation.save();
        await User.findByIdAndUpdate(req.userId, {$push: {conversationList: conv._id}});
        await User.findByIdAndUpdate(new mongoose.Types.ObjectId('68935956d6ad579fd8bb5f84'), {$push: {conversationList: conv._id}});
})

router.post('/message', authenticateToken,
  body('content').isString().isLength({min: 1, max: 200}).escape(),
  body('conversationId').isString().isLength({max: 60}),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ result: false, error: errors.array() });
    }
    const conversation = await Conversation.findById(req.body.conversationId);
    if (!conversation || (String(conversation.user1) !== String(req.userId) && String(conversation.user2) !== String(req.userId))) {
      return res.json({result: false, error: 'Conversation non trouvée'});
    }
    let user = String(conversation.user1) === String(req.userId) ? 1 : 2;
    await Conversation.findByIdAndUpdate(req.body.conversationId, {$push: {messageList: {creator: user, date: new Date(), content: req.body.content}}});
    res.json({result: true});
  } catch(error) {
    res.json({result: false, error: 'Server error'});
  }
});

router.get('/:conversationId', authenticateToken,
  param('conversationId').isString().isLength({max: 60}),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ result: false, error: errors.array() });
    }
    const conversation = await Conversation.findById(req.params.conversationId).populate({path: 'user1 user2', select: 'username photoList'});
    if (!conversation || (String(conversation.user1._id) !== String(req.userId) && String(conversation.user2._id) !== String(req.userId))) {
      return res.json({result: false, error: 'Conversation non trouvée'});
    }
    res.json({result: true, conversation});
  } catch(error) {
    res.json({result: false, error: 'Server error'});
  }
});

module.exports = router;