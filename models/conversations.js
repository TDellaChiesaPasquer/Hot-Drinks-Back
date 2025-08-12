const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    creator: Number,
    date: Date,
    content: String,
    seen: Boolean
})

const conversationSchema = mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  messageList: [messageSchema],
  lastActionDate: Date,
});

const Conversation = mongoose.model("conversations", conversationSchema);

module.exports = Conversation;
