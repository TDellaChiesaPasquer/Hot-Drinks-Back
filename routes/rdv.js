var express = require("express");
var router = express.Router();

require("../models/connection");
const Rdv = require("../models/rdv");
const User = require("../models/users");
const Conversation = require("../models/conversations");
const { body, validationResult, param } = require("express-validator");

const { authenticateToken } = require("../modules/jwt");
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const latitudeCheck = (value) => {
  const latitude = Number(value);
  return latitude >= -90 && latitude <= 90;
};

const longitudeCheck = (value) => {
  const longitude = Number(value);
  return longitude >= -180 && longitude <= 180;
};

const numberSanitize = (value) => {
  return Number(value);
};

router.put(
  "/ask",
  body("conversationId").isString().isLength({ max: 60 }),
  body("latitude").custom(latitudeCheck).customSanitizer(numberSanitize),
  body("longitude").custom(longitudeCheck).customSanitizer(numberSanitize),
  body("date").isISO8601(),
  authenticateToken,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const date = new Date(req.body.date);
      if (date.valueOf() < new Date().valueOf()) {
        return res.json({ result: false, error: "Date déjà passée" });
      }
      const conv = await Conversation.findById(req.body.conversationId);
      if (!conv) {
        res.json({ result: false, error: "Pas de conversation !" });
        return;
      }
      if (
        String(req.userId) !== String(conv.user1) &&
        String(req.userId) !== String(conv.user2)
      ) {
        res.json({
          result: false,
          error: "L'utilisateur ne fait pas parti de la conversation !",
        });
        return;
      }
      let receiver;
      if (String(req.userId) === String(conv.user1)) {
        receiver = conv.user2;
      } else {
        receiver = conv.user1;
      }
      const user = await User.findById(req.userId).populate('rdvList');
      const possibleRdv = user.rdvList.find(x => (String(receiver._id) === String(x.creator) || String(receiver._id) === String(x.receiver)) && (new Date(x.date)).valueOf() > (new Date()).valueOf() && (x.status === 'demande' || x.status === 'confirm'));
      if (possibleRdv) {
        res.json({result: false, error: 'Vous avez déjà un rendez-vous en cours'});
        return;
      }
      const requete = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=${process.env.EXPO_PUBLIC_TOKEN}&lat=${req.body.latitude}&lon=${req.body.longitude}&format=json&`
      );
      const data = await requete.json();
      console.log(data);
      const coordinateRdv = {
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        number: data.address.house_number,
        road: data.address.road,
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
          (coordinateRdv.number ? coordinateRdv.number + ', ' : '') +
          (coordinateRdv.road ? coordinateRdv.road + ', ' : '') + 
          (coordinateRdv.city ? coordinateRdv.city + ', ' : '') +
          (coordinateRdv.country || ''),
        date,
      });
      const rdv = await newRdv.save();
      await User.findByIdAndUpdate(req.userId, {
        $push: { rdvList: rdv._id },
      });
      await User.findByIdAndUpdate(receiver, {
        $push: { rdvList: rdv._id },
      });
      pusher.trigger(String(rdv.creator), "newRdv", {
        rdvId: String(rdv._id),
      });
      pusher.trigger(String(rdv.receiver), "newRdv", {
        rdvId: String(rdv._id),
      });
      res.json({ result: true});
    } catch (error) {
      console.log(error);
      res.json({ result: false, error: "Server error" });
    }
  }
);

const statusDemandeCheck = (value) => {
  return value === "confirm" || value === "refused";
};

router.put(
  "/response",
  body("rdvId").isString().isLength({ max: 60 }),
  body("status").isString().custom(statusDemandeCheck),
  authenticateToken,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const rdv = await Rdv.findById(req.body.rdvId);
      if (!rdv) {
        res.json({ result: false, error: "Rendez-vous introuvable" });
        return;
      }
      if (String(rdv.receiver) !== String(req.userId)) {
        res.json({
          result: false,
          error: "Vous n'êtes pas le destinataire de ce rendez-vous",
        });
        return;
      }
      if (rdv.status !== "demande") {
        res.json({ result: false, error: "La demande a déjà été remplie" });
        return;
      }
      await Rdv.findByIdAndUpdate(rdv._id, { status: req.body.status });
      pusher.trigger(String(rdv.creator), "rdv", {
        rdvId: String(rdv._id),
      });
      pusher.trigger(String(rdv.receiver), "rdv", {
        rdvId: String(rdv._id),
      });
      res.json({ result: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ result: false, error: "Server error" });
    }
  }
);

router.put(
  "/cancel",
  body("rdvId").isString().isLength({ max: 60 }),
  authenticateToken,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const rdv = await Rdv.findById(req.body.rdvId);
      if (!rdv) {
        res.json({ result: false, error: "Rendez-vous introuvable" });
        return;
      }
      if (
        String(rdv.receiver) !== String(req.userId) &&
        String(rdv.creator) !== String(req.userId)
      ) {
        res.json({
          result: false,
          error: "Vous n'êtes pas membre de ce rendez-vous",
        });
        return;
      }
      if (rdv.status !== "confirm") {
        res.json({
          result: false,
          error: "Le rendez-vous ne peut être annulé",
        });
        return;
      }
      await Rdv.findByIdAndUpdate(rdv._id, { status: "cancel" });
      pusher.trigger(String(rdv.creator), "rdv", {
        rdvId: String(rdv._id),
      });
      pusher.trigger(String(rdv.receiver), "rdv", {
        rdvId: String(rdv._id),
      });
      res.json({ result: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ result: false, error: "Server error" });
    }
  }
);

router.get(
  "/reload/:rdvId",
  authenticateToken,
  param("rdvId").isString().isLength({ max: 60 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const rdv = await Rdv.findById(req.params.rdvId).populate({
        path: "creator receiver",
        select: "username birthdate gender orientation relationship photoList tastesList",
      });
      if (!rdv) {
        res.json({ result: false, error: "Rendez-vous introuvable" });
        return;
      }
      if (
        String(rdv.receiver._id) !== String(req.userId) &&
        String(rdv.creator._id) !== String(req.userId)
      ) {
        res.json({
          result: false,
          error: "Vous n'êtes pas membre de ce rendez-vous",
        });
        return;
      }
      res.json({ result: true, rdv });
    } catch (error) {
      console.log(error);
      res.status(500).json({ result: false, error: "Server error" });
    }
  }
);

module.exports = router;
