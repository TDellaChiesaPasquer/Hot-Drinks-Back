const mongoose = require("mongoose");

const tasteSchema = mongoose.Schema({
  category: String,
  label: String,
  value: String,
  star: Boolean,
});

const userSchema = mongoose.Schema({
  username: String,
  birthdate: Date,
  gender: String,
  accountType: String,
  password: { type: String, select: false },
  email: String,
  phoneNumber: String,
  photoList: [String],
  likesList: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  dislikesList: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  superlikesList: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  tastesList: [tasteSchema],
  orientation: String,
  relationship: String,
  ageRange: String,
  distance: Number,
  disableAccount: Boolean,
  premiumAccount: Boolean,
  latitude: Number,
  longitude: Number,
  blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  conversationList: [
    { type: mongoose.Schema.Types.ObjectId, ref: "conversations" },
  ],
  rdvList: [{ type: mongoose.Schema.Types.ObjectId, ref: "rdvs" }],
  valid: { type: Boolean, default: false },
  tokenNumber: { type: Number, default: 0 },
  proposedList: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  superlikeNumber: {type: Number, default: 0},
  lastSuperlike: Date
});

const User = mongoose.model("users", userSchema);

module.exports = User;
