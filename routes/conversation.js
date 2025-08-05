var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Conversation = require("../models/conversations");
const { authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

router.post('/message', authenticateToken,
  body('content').isString().isLength({min: 1, max: 200}).escape(),
  body('conversationId').isString().isLength({max: 60}),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ result: false, error: errors.array() });
    }
    console.log(req.userId)
    const conversation = await Conversation.findById(req.body.conversationId);
    console.log(conversation)
    if (!conversation || (String(conversation.user1) !== String(req.userId) && String(conversation.user2) !== String(req.userId))) {
      return res.json({result: false, error: 'Conversation non trouvée'});
    }
    let user = conversation.user1 === req.userId ? 1 : 2;
    await Conversation.findByIdAndUpdate(req.body.conversationId, {$push: {messageList: {creator: user, date: new Date(), content: req.body.content}}});
    res.json({result: true});
  } catch(error) {
    res.json({result: false, error: 'Server error'});
  }
});

router.get('/', authenticateToken,
  body('conversationId').isString().isLength({max: 60}),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ result: false, error: errors.array() });
    }
    const conversation = await Conversation.findById(req.body.conversationId);
    if (!conversation || (conversation.user1 !== req.userId && conversation.user2 !== req.userId)) {
      return res.json({result: false, error: 'Conversation non trouvée'});
    }
    res.json({result: true, conversation});
  } catch(error) {
    res.json({result: false, error: 'Server error'});
  }
});

module.exports = router;