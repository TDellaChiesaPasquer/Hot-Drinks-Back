var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");

const uniqid = require("uniqid");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

//_________________________________________________________SIGN UP_______________________________________________________________

router.post("/signup", body("email").isEmail().escape(), body("password").isString().isLength({ min: 8, max: 32 }), async function (req, res, next) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const email = req.body.email.toLowerCase();
		const data = await User.findOne({ email }).select("password");
		const hash = bcrypt.hashSync(req.body.password, 10);
		if (data) {
			if (bcrypt.compareSync(req.body.password, data.password)) {
				const token = generateAccessToken(data._id);
				res.json({
					result: true,
					message: "User is connected",
					token: token,
				});
			} else {
				res.json({ result: false, error: "Wrong password or email" });
			}
		} else {
			const newUser = new User({
				email,
				password: hash,
			});

			const savedUser = await newUser.save();
			const token = generateAccessToken(savedUser._id);
			res.json({
				result: true,
				message: "New user has been saved",
				token: token,
			});
		}
	} catch (error) {
		res.status(500).json({ result: false, error: "Server error" });
	}
});

router.get("/infos", authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.userId).populate({
			path: "conversationList",
			populate: { path: "user1 user2", select: "username photoList" },
		});
		res.json({ result: true, user });
	} catch (error) {
		console.log(error);
		res.status(500).json({ result: false, error: "Server error" });
	}
});

const genderCheck = (value) => {
	if (value === "Homme" || value === "Femme" || value === "Non binaire") {
		return true;
	}
	return false;
};

const orientationCheck = (value) => {
	if (value === "Homme" || value === "Femme" || value === "Tout") {
		return true;
	}
	return false;
};

const relationshipCheck = (value) => {
	if (["Chocolat chaud", "Allongé", "Thé", "Expresso", "Ristretto", "Matcha"].some((x) => x === value)) {
		return true;
	}
	return false;
};

//_________________________________________________________ADD USER INFOS_______________________________________________________________
router.put(
	"/userInfos",
	authenticateToken,
	body("birthdate").isISO8601(),
	body("username").isString().isLength({ max: 40 }).escape(),
	body("gender").custom(genderCheck),
	body("orientation").custom(orientationCheck),
	body("relationship").custom(relationshipCheck),
	async function (req, res, next) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ result: false, error: errors.array() });
			}
			await User.findByIdAndUpdate(req.userId, {
				birthdate: new Date(req.body.birthdate),
				username: req.body.username,
				gender: req.body.gender,
				orientation: req.body.orientation,
				relashionship: req.body.relationship,
			});
			res.json({ result: true, message: "User infos updated" });
		} catch (error) {
			res.status(500).json({ result: false, error: "Server error" });
		}
	}
);

//_________________________________________________________ADD PICTURES_______________________________________________________________
router.post(
	"/addPhoto/:i",
	// authenticateToken,
	async function (req, res, next) {
		const length = req.params.i;
		const paths = [];
		try {
			for (let i = 0; i < length; i++) {
				paths.push(`./tmp/photo${uniqid()}.jpg`);
				const resultMove = await req.files["photoFromFront" + i].mv(paths[i]);
				if (resultMove) {
					throw new Error("Failed to move photo");
				}
			}
			const photoURIList = [];
			for (let i = 0; i < paths.length; i++) {
				const resultCloudinary = await cloudinary.uploader.upload(paths[i]);
				const uri = resultCloudinary.secure_url;
				photoURIList.push(uri);
				await User.findByIdAndUpdate("689083d05634401ba79696fd", {
					$push: { photoList: uri },
				});
				fs.unlinkSync(paths[i]);
			}

			res.json({ result: true, photoURLList: photoURIList });
		} catch (error) {
			console.log(error);
			for (let i = 0; i < paths.length; i++) {
				fs.unlinkSync(paths[i]);
			}
			res.json({ result: false, error: "Server error" });
		}
	}
);

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
	"/location",
	authenticateToken,
	body("latitude").custom(latitudeCheck).customSanitizer(numberSanitize),
	body("longitude").custom(longitudeCheck).customSanitizer(numberSanitize),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ result: false, error: errors.array() });
			}
			await User.findByIdAndUpdate(req.userId, {
				latitude: req.body.latitude,
				longitude: req.body.longitude,
			});
			res.json({ result: true, message: "User infos updated" });
		} catch (error) {
			res.status(500).json({ result: false, error: "Server error" });
		}
	}
);

module.exports = router;
