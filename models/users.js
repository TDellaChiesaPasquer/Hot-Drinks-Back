const mongoose = require("mongoose");

const tasteSchema= mongoose.Schema({
      category: String,
      value: String,
      star: Boolean,
})

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
  relashionship: String,
  ageRange: String,
  distance: Number,
  disableAccount: Boolean,
  premiumAccount: Boolean,
  latitude: Number,
  longitude: Number,
  blocklist: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  conversationList: [{ type: mongoose.Schema.Types.ObjectId, ref: "conversations" },
  ],
  rdvList: [{ type: mongoose.Schema.Types.ObjectId, ref: "rdv" }],
});

const User = mongoose.model("users", userSchema);

module.exports = User;
