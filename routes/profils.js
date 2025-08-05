var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { authenticateToken } = require("../modules/jwt");


//_________________________________________________________ENVOYER DES PROFILS_______________________________________________________________

router.get("/profil", authenticateToken, async (req, res) => {
    try {
        const data = await User.find({})
            .select("username birthdate gender orientation relashionship photoList distance");
        res.json({result: true, profilList: data.slice(0, 10)});
    } catch (error) {
        res.json({result: false, error: 'Server error'});
    }
});

//_________________________________________________________SWIPER (LIKE/DISLIKE/SUPERLIKE)_______________________________________________________________

router.put("/swipe", authenticateToken, async (req, res) => {
  try{
  if (req.body.action === "like") {
    const data = await User.findByIdAndUpdate(req.userId, {
      $push: { likesList: req.body.userId },
    })
      res.json({ result: true, likesList: data });
      console.log(data, "Le profil a été liké !");
  } else if (req.body.action === "superlike") {
    const data = await User.findByIdAndUpdate(req.userId, {
      $push: { superlikesList: req.body.userId },
    })
    res.json({ result: true, superlikesList: data });
      console.log(data, "Le profil a été superliké !");
    }  else {
    const data = await User.findByIdAndUpdate(req.userId, {
      $push: { dislikesList: req.body.userId },
    })
      res.json({ result: false, dislikesList: data });
      console.log(data, "Le profil a été disliké !")
  }
  } catch(error) {
        res.json({result: false, error: 'Server error'});
  }
});

module.exports = router;
