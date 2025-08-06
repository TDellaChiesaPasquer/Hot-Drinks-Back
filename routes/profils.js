var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Conversation = require("../models/conversations");
const { authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");

//_________________________________________________________ENVOYER DES PROFILS_______________________________________________________________

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1); // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180);
}

// function logIfExists(varName, scope = globalThis) {
// 	try {
// 		if (varName in scope) {
// 			const value = scope[varName];
// 			if (value !== null && value !== undefined) {
// 				console.log(`${varName} =`, value);
// 			} else {
// 				console.log(`${varName} est null ou undefined`);
// 			}
// 		} else {
// 			console.log(`${varName} est non définie`);
// 		}
// 	} catch (err) {
// 		console.log(`${varName} inaccessible :`, err.message);
// 	}
// }

router.get("/profil", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.userId);
		if (!user) {
			res.status(403).json({ result: false, error: "User not found" });
			return;
		}
		const data = await User.find({}).select("username birthdate gender orientation tastesList relationship photoList latitude longitude").limit(10);

		const result = [];
		for (const element of data) {
			const { username, birthdate, gender, orientation, tastesList, relationship, photoList, latitude, longitude } = element;

			// logIfExists("user");
			// logIfExists("latitude");
			// logIfExists("longitude");

			// if (typeof user !== "undefined") {
			// 	logIfExists("user.latitude", user);
			// 	logIfExists("user.longitude", user);
			// }

			let distance = "NaN";
			// Problème de vairables null lors du calcul de la distance -> résultat erreur 500 -> impossible de tester
			if (
				typeof user !== "undefined" &&
				user !== null &&
				typeof user.latitude !== "undefined" &&
				user.latitude !== null &&
				typeof user.longitude !== "undefined" &&
				user.longitude !== null &&
				typeof latitude !== "undefined" &&
				latitude !== null &&
				typeof longitude !== "undefined" &&
				longitude !== null
			) {
				distance = `${Math.ceil(getDistanceFromLatLonInKm(user.latitude, user.longitude, latitude, longitude))} km`;
			}
			result.push({ username, birthdate, gender, orientation, tastesList, relationship, photoList, distance });
		}
		res.json({ result: true, profilList: result });
	} catch (error) {
		console.log(error);
		res.status(500).json({ result: false, error: "Server error" });
	}
});

//_________________________________________________________SWIPER (LIKE/DISLIKE/SUPERLIKE)_______________________________________________________________

router.put("/swipe", authenticateToken, body("action").isString(), body("userId").isString().isLength({ max: 60 }).escape(), async (req, res) => {
	if (req.body.userId) console.log("Swipe - userId : " + req.body.userId);
	if (req.body.action) console.log("Swipe - action : " + req.body.action);
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const otherUser = await User.findById(req.body.userId);
		if (!otherUser) {
			res.json({ result: false, error: "Profil non trouvé" });
			return;
		}
		if (req.body.action === "like") {
			const data = await User.findByIdAndUpdate(req.userId, {
				$push: { likesList: req.body.userId },
			});
			let match = false;
			if (otherUser.likesList.some((x) => String(x) === String(req.userId))) {
				match = true;
				const newConversation = new Conversation({
					user1: req.userId,
					user2: req.body.userId,
					messageList: [],
				});
				const conv = await newConversation.save();
				await User.findByIdAndUpdate(req.userId, { $push: { conversationList: conv._id } });
				await User.findByIdAndUpdate(req.body.userId, { $push: { conversationList: conv._id } });
			}
			res.json({ result: true, likesList: data, match });
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
