var express = require("express");
var router = express.Router();

require("../models/connection");
const Rdv = require("../models/rdv");
const User = require("../models/users");

const { authenticateToken } = require("../modules/jwt");

router.put("/ask", authenticateToken, async (req, res) => {
  const requete = await fetch(
    `https://us1.locationiq.com/v1/reverse?key=${process.env.EXPO_PUBLIC_TOKEN}&lat=${req.body.latitude}&lon=${req.body.longitude}&format=json&`
  );
  try {
    // if (req.status === demande) {
    const data = await requete.json();
    //console.log(data);
    const coordinateRdv = {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      address: data.address.government,
      city: data.address.city,
      country: data.address.country,
    };
    console.log("ici");
    res.json({ result: true, location: coordinateRdv });
    // }
  } catch (error) {
    console.log(error);
    res.json({ result: false, error: "Server error" });
  }
});

router.put("/rdv/reponse", authenticateToken, async (req, res) => {
  try {
    // if (req.body.status === confirmé) {
    //   const data = await User.findByIdAndUpdate(req.userId, {
    //     $push: { rdvList: req.body.userId },
    //     $pull: { rdvList: new mongoose.Types.ObjectId(req.body.userId) },
    //   });
    //   res.json({ result: true, superlikesList: data });
    //   console.log("Le profil a été superliké !");
    //   res.json;
    // }
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.put("/rdv/cancel", authenticateToken, async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.get("/rdv/reload", authenticateToken, async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
