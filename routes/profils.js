var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { authenticateToken } = require("../modules/jwt");

// const Profil = {
// 	username: String,
// 	birthdate: Date,
// 	gender: String,
// 	orientation: String,
// 	relashionship: String,
// };

//_________________________________________________________ENVOYER DES PROFILS_______________________________________________________________

router.get("/profil", (req, res) => {
	for (let i = 0; i < User.length; i++) {
		User.find({})
			.select("username", "birthdate", "gender", "orientation", "relashionship", "photoList", "distance")
			.then((data) => {
				res.json({ result: true, profilList: data.slice(0, 10) });
				// } else {
				//     res.json({result: false, error: 'Profil non trouvé !'})
			});
      //.catch((error) => { // Permet d'envoyer un message lorsque la commande User.find({}) n'aboutit pas
      // 	res.json({ result: false, error: "Erreur serveur" });
      // });
	}
});

//_________________________________________________________SWIPER (LIKE/DISLIKE/SUPERLIKE)_______________________________________________________________

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
