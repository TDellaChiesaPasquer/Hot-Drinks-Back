var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { authenticateToken } = require("../modules/jwt");

router.get("/profil", (req, res) => {
  for (let i = 0; i < User.length; i++) {
    User.find({})
      .select(
        "username",
        "birthdate",
        "gender",
        "orientation",
        "relashionship",
        "photoList",
        "distance"
      )
      .then((data) => {
        res.json({ result: true, profilList: data.slice(0, 10) });
        // } else {
        //     res.json({result: false, error: 'Profil non trouvé !'})
      });
  }
});

router.put("/swipe", authenticateToken, (req, res) => {
  if (req.body.action === "like") {
    User.findByIdAndUpdate(req.userId, {
      $push: { likesList: req.body.userId },
    }).then((data) => {
      res.json({ result: true, likesList: data });
      console.log(data, "Le profil a été liké !");
    });
  } else if (req.body.action === "superlike") {
    User.findByIdAndUpdate(req.userId, {
      $push: { superlikesList: req.body.userId },
    }).then((data) => {
      res.json({ result: true, superlikesList: data });
      console.log(data, "Le profil a été superliké !");
    });
  } else {
    User.findByIdAndUpdate(req.userId, {
      $push: { dislikesList: req.body.userId },
    }).then((data) => {
      res.json({ result: false, dislikesList: data });
      console.log(data, "Le profil a été disliké !");
    });
  }
});

module.exports = router;
