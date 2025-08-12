var express = require("express");
var router = express.Router();

require("../models/connection");
const Rdv = require("../models/rdv");
const User = require("../models/users");
const Conversation = require("../models/conversations");

const { authenticateToken } = require("../modules/jwt");

router.put("/ask", authenticateToken, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.body.conversationId);
    if (!conv) {
      res.json({ result: false, error: "Pas de conversation !" });
      return;
    }
    if (req.userId !== conv.user1 && req.userId !== conv.user2) {
      res.json({
        result: false,
        error: "L'utilisateur ne fait pas parti de la conversation !",
      });
      return;
    }
    let receiver;
    if (req.userId === conv.user1) {
      receiver = conv.user2;
    } else {
      receiver = conv.user1;
    }
    const requete = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${process.env.EXPO_PUBLIC_TOKEN}&lat=${req.body.latitude}&lon=${req.body.longitude}&format=json&`
    );
    const data = await requete.json();
    //console.log(data);
    const coordinateRdv = {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      address: data.address.government,
      city: data.address.city,
      country: data.address.country,
    };
    const newRdv = new Rdv({
      status: "demande",
      creator: req.userId,
      receiver: receiver,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      address:
        coordinateRdv.address +
        ", " +
        coordinateRdv.city +
        ", " +
        coordinateRdv.country,
      date: req.body.date,
    });
    const rdv = await newRdv.save();
    console.log("ici");
    await User.findByIdAndUpdate(req.userId, {
      $push: { rdvList: rdv._id },
    });
    await User.findByIdAndUpdate(receiver, {
      $push: { rdvList: rdv._id },
    });
    res.json({ result: true, rdv: newRdv });
  } catch (error) {
    console.log(error);
    res.json({ result: false, error: "Server error" });
  }
});

router.put("/reponse", authenticateToken, async (req, res) => {
  try {
    if (req.body.status === confirmé) {
      const data = await User.findByIdAndUpdate(req.userId, {
        $push: { rdvList: req.body.userId },
        $pull: { rdvList: new mongoose.Types.ObjectId(req.body.userId) },
      });
      res.json({ result: true, rdvList: data });
      console.log("Le rdv a été confirmé !");
      res.json;
    } else req.body.status === refusé;
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.put("/cancel", authenticateToken, async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.get("/reload", authenticateToken, async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
