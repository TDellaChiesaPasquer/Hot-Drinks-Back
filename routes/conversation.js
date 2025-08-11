var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Conversation = require("../models/conversations");
const { authenticateToken } = require("../modules/jwt");
const { body, validationResult, param } = require("express-validator");
const mongoose = require("mongoose");
const Pusher = require("pusher");

const pusher = new Pusher({
	appId: process.env.PUSHER_APPID,
	key: process.env.PUSHER_KEY,
	secret: process.env.PUSHER_SECRET,
	cluster: process.env.PUSHER_CLUSTER,
	useTLS: true,
});

router.post("/message", authenticateToken, body("content").isString().isLength({ min: 1, max: 200 }).escape(), body("conversationId").isString().isLength({ max: 60 }), async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const conversation = await Conversation.findById(req.body.conversationId);
		if (!conversation || (String(conversation.user1) !== String(req.userId) && String(conversation.user2) !== String(req.userId))) {
			return res.json({ result: false, error: "Conversation non trouvée" });
		}
		let user = String(conversation.user1) === String(req.userId) ? 1 : 2;
		await Conversation.findByIdAndUpdate(req.body.conversationId, {
			$push: { messageList: { creator: user, date: new Date(), content: req.body.content, seen: false } },
			lastActionDate: new Date(),
		});
		pusher.trigger(String(conversation.user1), "newMessage", {
			conversationId: String(conversation._id),
		});
		pusher.trigger(String(conversation.user2), "newMessage", {
			conversationId: String(conversation._id),
		});
		res.json({ result: true });
	} catch (error) {
		console.log(error);
		res.json({ result: false, error: "Server error" });
	}
});

router.get("/:conversationId", authenticateToken, param("conversationId").isString().isLength({ max: 60 }), async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const conversation = await Conversation.findById(req.params.conversationId).populate({ path: "user1 user2", select: "username photoList" });
		if (!conversation || (String(conversation.user1._id) !== String(req.userId) && String(conversation.user2._id) !== String(req.userId))) {
			return res.json({ result: false, error: "Conversation non trouvée" });
		}
		res.json({ result: true, conversation });
	} catch (error) {
		res.json({ result: false, error: "Server error" });
	}
});

router.put("/:conversationId", authenticateToken, param("conversationId").isString().isLength({ max: 60 }), async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const conversation = await Conversation.findById(req.params.conversationId);
		if (!conversation || (String(conversation.user1._id) !== String(req.userId) && String(conversation.user2._id) !== String(req.userId))) {
			return res.json({ result: false, error: "Conversation non trouvée" });
		}
		const otherUserNumber = String(conversation.user1._id) === String(req.userId) ? 2 : 1;
		await Conversation.findByIdAndUpdate(req.params.conversationId, { $set: { "messageList.$[otherMessage].seen": true } }, { arrayFilters: [{ "otherMessage.creator": otherUserNumber }] });
		pusher.trigger(String(conversation[`user${otherUserNumber}`]), "newMessage", {
			conversationId: String(conversation._id),
		});
		res.json({ result: true, conversation });
	} catch (error) {
		res.json({ result: false, error: "Server error" });
	}
});

router.delete("/:conversationId", authenticateToken, param("conversationId").isString().isLength({ max: 60 }), async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const conversation = await Conversation.findById(req.params.conversationId);
		if (!conversation || (String(conversation.user1._id) !== String(req.userId) && String(conversation.user2._id) !== String(req.userId))) {
			return res.json({ result: false, error: "Conversation non trouvée" });
		}
		const otherUserNumber = String(conversation.user1._id) === String(req.userId) ? 2 : 1;
		await User.findByIdAndUpdate(conversation[`user${3 - otherUserNumber}`], { $pull: { conversationList: conversation._id }, $push: { blockList: conversation[`user${otherUserNumber}`] } });
		await User.findByIdAndUpdate(conversation[`user${otherUserNumber}`], { $pull: { conversationList: conversation._id } });
		await Conversation.findByIdAndDelete(req.params.conversationId);
		pusher.trigger(String(conversation[`user1`]), "block", {
			conversationId: String(conversation._id),
		});
		pusher.trigger(String(conversation[`user2`]), "block", {
			conversationId: String(conversation._id),
		});
		res.json({ result: true });
	} catch (error) {
		res.json({ result: false, error: "Server error" });
	}
});

module.exports = router;
