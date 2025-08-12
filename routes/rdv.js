var express = require("express");
var router = express.Router();

require("../models/connection");
const Rdv = require("../models/rdv");
const User = require("../models/users");

const { authenticateToken } = require("../modules/jwt");
const Conversation = require("../models/conversations");

router.put("/ask", authenticateToken, async (req, res) => {
  try {
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
      status: req.body.status,
      address: req.body.address,
      date: req.body.date,
    });
    const rdv = await newRdv.save();
    console.log("ici");
    await User.findByIdAndUpdate(req.body.creator, {
      $push: { rdvList: rdv._id },
    });
    res.json({ result: true, location: coordinateRdv, rdv: newRdv });
  } catch (error) {
    console.log(error);
    res.json({ result: false, error: "Server error" });
  }
});

router.put("/reponse", authenticateToken, async (req, res) => {
  try {
    const rdv = await Rdv.findById(req.body.rdvId);
    if (!rdv) {
      res.json({result: false, error: 'Rendez-vous introuvable'});
      return;
    }
    if (String(rdv.receiver) !== String(req.userId)) {
      res.json({result: false, error: "Vous n'êtes pas le destinataire de ce rendez-vous"});
      return;
    }
    if (rdv.status !== 'demande') {
      res.json({result: false, error: "La demande a déjà été remplie"});
      return;
    }
    await Rdv.findByIdAndUpdate(rdv._id, {status: req.body.status});
    res.json({result: true});
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.put("/cancel", authenticateToken, async (req, res) => {
  try {
    const rdv = await Rdv.findById(req.body.rdvId);
    if (!rdv) {
      res.json({result: false, error: 'Rendez-vous introuvable'});
      return;
    }
    if (String(rdv.receiver) !== String(req.userId) && String(rdv.creator) !== String(req.userId)) {
      res.json({result: false, error: "Vous n'êtes pas membre de ce rendez-vous"});
      return;
    }
    if (rdv.status !== 'confirmé') {
      res.json({result: false, error: "Le rendez-vous ne peut être annulé"});
      return;
    }
    await Rdv.findByIdAndUpdate(rdv._id, {status: 'cancel'});
    res.json({result: true});
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.get("/reload/:rdvId", authenticateToken, async (req, res) => {
  try {
    const rdv = await Rdv.findById(req.params.rdvId);
    if (!rdv) {
      res.json({result: false, error: 'Rendez-vous introuvable'});
      return;
    }
    if (String(rdv.receiver) !== String(req.userId) && String(rdv.creator) !== String(req.userId)) {
      res.json({result: false, error: "Vous n'êtes pas membre de ce rendez-vous"});
      return;
    }
    res.json({result: true, rdv});
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
