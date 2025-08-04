const mongoose = require("mongoose");

const rdvSchema = mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  status: String,
  longitude: Number,
  latitude: Number,
  date: Date,
});

const Rdv = mongoose.model("rdvs", rdvSchema);

module.exports = Rdv;
