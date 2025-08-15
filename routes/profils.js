var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Conversation = require("../models/conversations");
const { authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Pusher = require("pusher");
const dayjs = require("dayjs");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

//_________________________________________________________ENVOYER DES PROFILS_______________________________________________________________

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

router.get("/profil", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("proposedList");
    if (user.proposedList && user.proposedList.length !== 0) {
      const result = [];
      for (const element of user.proposedList) {
        const {
          _id,
          username,
          birthdate,
          gender,
          orientation,
          relationship,
          photoList,
          latitude,
          longitude,
          tastesList,
          superlikesList,
        } = element;
        if (String(_id) === String(req.userId)) {
          continue;
        }
        const distance = `${Math.ceil(
          getDistanceFromLatLonInKm(
            user.latitude,
            user.longitude,
            latitude,
            longitude
          )
        )} km`;
        result.push({
          _id,
          username,
          birthdate,
          gender,
          orientation,
          relationship,
          photoList,
          distance,
          tastesList,
          superlikesList,
        });
      }
      res.json({ result: true, profilList: result });
      return;
    }
    const genderList =
      user.orientation === "Homme"
        ? ["Homme"]
        : user.orientation === "Femme"
        ? ["Femme"]
        : ["Homme", "Femme", "Non binaire"];
    const orientationList =
      user.gender === "Homme"
        ? ["Homme", "Tout"]
        : user.gender === "Femme"
        ? ["Femme", "Tout"]
        : ["Tout"];
    const ageMin = new Date(
      new Date().valueOf() -
        Number(user.ageRange.slice(0, 2)) * 365 * 24 * 60 * 60 * 1000
    );
    const ageMax = new Date(
      new Date().valueOf() -
        Number(
          user.ageRange.slice(3) === "65" ? "120" : user.ageRange.slice(3)
        ) *
          365 *
          24 *
          60 *
          60 *
          1000
    );
    const data = await User.aggregate([
      {
        $match: {
          valid: true,
          gender: { $in: genderList },
          orientation: { $in: orientationList },
          birthdate: { $lte: ageMin, $gte: ageMax },
        },
      },
      {
        $sample: {
          size: 2000,
        },
      },
    ]);
    const result = [];
    for (const element of data) {
      if (result.length === 10) {
        break;
      }
      const {
        _id,
        username,
        birthdate,
        gender,
        orientation,
        relationship,
        photoList,
        latitude,
        longitude,
        tastesList,
        superlikesList,
      } = element;
      if (String(_id) === String(req.userId)) {
        continue;
      }
      if (
        user.likesList.some((x) => String(x) === String(_id)) ||
        user.superlikesList.some((x) => String(x) === String(_id)) ||
        user.blockList.some((x) => String(x) === String(_id))
      ) {
        continue;
      }
      const distance = Math.ceil(
        getDistanceFromLatLonInKm(
          user.latitude,
          user.longitude,
          latitude,
          longitude
        )
      );
      if (distance > (user.distance === 600 ? 40000 : user.distance)) {
        continue;
      }
      const distanceString = `${distance} km`;
      result.push({
        _id,
        username,
        birthdate,
        gender,
        orientation,
        relationship,
        photoList,
        distance: distanceString,
        tastesList,
        superlikesList,
      });
    }
    await User.findByIdAndUpdate(req.userId, { proposedList: result });
    res.json({ result: true, profilList: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

//_________________________________________________________SWIPER (LIKE/DISLIKE/SUPERLIKE)_______________________________________________________________
const newMatch = async (req) => {
  const newConversation = new Conversation({
    user1: req.userId,
    user2: req.body.userId,
    messageList: [],
    lastActionDate: new Date(),
  });
  const conv = await newConversation.save();
  await User.findByIdAndUpdate(req.userId, {
    $push: { conversationList: conv._id },
  });
  await User.findByIdAndUpdate(req.body.userId, {
    $push: { conversationList: conv._id },
  });
  pusher.trigger(String(req.userId), "match", {
    conversationId: String(conv._id),
  });
  pusher.trigger(String(req.body.userId), "match", {
    conversationId: String(conv._id),
  });
};

router.put(
  "/swipe",
  authenticateToken,
  body("action").isString(),
  body("userId").isString().isLength({ max: 60 }).escape(),
  async (req, res) => {
    try {
      console.log("test");
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const user = await User.findById(req.userId);
      if (
        !user.proposedList.some((x) => String(x) === String(req.body.userId))
      ) {
        return res.json({ result: false, error: "Profil non proposé" });
      }
      const otherUser = await User.findById(req.body.userId);
      if (!otherUser) {
        res.status(403).res.json({ result: false, error: "Profil non trouvé" });
        return;
      }
      if (req.body.action.toLowerCase() === "like") {
        const data = await User.findByIdAndUpdate(req.userId, {
          $push: { likesList: req.body.userId },
          $pull: { proposedList: new mongoose.Types.ObjectId(req.body.userId) },
        });
        let match = false;
        if (
          otherUser.likesList.some((x) => String(x) === String(req.userId)) ||
          otherUser.superlikesList.some((x) => String(x) === String(req.userId))
        ) {
          match = true;
          await newMatch(req);
        }
        res.json({ result: true, likesList: data, match });
        console.log("Le profil a été liké !");
      } else if (req.body.action.toLowerCase() === "superlike") {
        const superlikeDate = user.lastSuperlike || new Date();
        const today = dayjs()
          .set("hour", 0)
          .set("minute", 0)
          .set("second", 0)
          .set("millisecond", 0);
        let superlikeNumber = user.superlikeNumber;
        if (today.valueOf() - superlikeDate.valueOf() > 0 || !superlikeNumber) {
          superlikeNumber = 0;
        }
        if (superlikeNumber >= 3) {
          res.json({
            result: false,
            error: "Nombre maximal de superlike atteint",
          });
          return;
        }
        await User.findByIdAndUpdate(req.userId, {
          lastSuperlike: new Date(),
          superlikeNumber: superlikeNumber + 1,
        });
        const data = await User.findByIdAndUpdate(req.userId, {
          $push: { superlikesList: req.body.userId },
          $pull: { proposedList: new mongoose.Types.ObjectId(req.body.userId) },
        });
        let match = false;
        if (
          otherUser.likesList.some((x) => String(x) === String(req.userId)) ||
          otherUser.superlikesList.some((x) => String(x) === String(req.userId))
        ) {
          match = true;
          await newMatch(req);
        }
        res.json({ result: true, superlikesList: data, match });
        console.log("Le profil a été superliké !");
      } else {
        const data = await User.findByIdAndUpdate(req.userId, {
          $push: { dislikesList: req.body.userId },
          $pull: { proposedList: new mongoose.Types.ObjectId(req.body.userId) },
        });
        res.json({ result: false, dislikesList: data });
        console.log("Le profil a été disliké !");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ result: false, error: "Server error" });
    }
  }
);

module.exports = router;
