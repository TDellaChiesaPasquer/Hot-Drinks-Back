var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");

//_________________________________________________________ENVOYER DES PROFILS_______________________________________________________________

router.get("/profil", authenticateToken, async (req, res) => {
	try {
		const data = await User.find({}).select("username birthdate gender orientation relashionship photoList distance").limit(10);
		console.log("/profil : ");
		console.log(data);
		res.json({ result: true, profilList: data });
	} catch (error) {
		res.status(500).json({ result: false, error: "Server error" });
	}
});

//_________________________________________________________SWIPER (LIKE/DISLIKE/SUPERLIKE)_______________________________________________________________

router.put("/swipe", authenticateToken, body("action").isString(), body("userId").isString().isLength({ max: 60 }).escape(), async (req, res) => {
	if (req.body.userId) console.log("Swipe - userId : " + req.body.userId);
	if (req.body.action) console.log("Swipe - action : " + req.body.action);
	try {
		if (req.body.action === "like") {
			const data = await User.findByIdAndUpdate(req.userId, {
				$push: { likesList: req.body.userId },
			});
			res.json({ result: true, likesList: data });
			console.log(data, "Le profil a été liké !");
		} else if (req.body.action === "superlike") {
			const data = await User.findByIdAndUpdate(req.userId, {
				$push: { superlikesList: req.body.userId },
			});
			res.json({ result: true, superlikesList: data });
			console.log(data, "Le profil a été superliké !");
		} else {
			const data = await User.findByIdAndUpdate(req.userId, {
				$push: { dislikesList: req.body.userId },
			});
			res.json({ result: false, dislikesList: data });
			console.log(data, "Le profil a été disliké !");
		}
	} catch (error) {
		res.status(500).json({ result: false, error: "Server error" });
	}
});

module.exports = router;
