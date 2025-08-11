var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");

const salt = 10;

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
		const data = await User.findOne({ email }).select("password tokenNumber");
		const hash = bcrypt.hashSync(req.body.password, salt);
		if (data) {
			if (bcrypt.compareSync(req.body.password, data.password)) {
				const tokenNumber = data.tokenNumber ? data.tokenNumber + 1 : 1;
				const token = await generateAccessToken(data._id, tokenNumber);
				res.json({
					result: true,
					message: "User is connected",
					token: token,
				});
			} else {
				res.json({ result: false, error: "L'addresse email est déjà utilisée" });
			}
		} else {
			const newUser = new User({
				email,
				password: hash,
			});

			const savedUser = await newUser.save();
			const token = await generateAccessToken(savedUser._id, 1);
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
		if (!user.valid && user.birthdate && user.latitude && user.photoList.length !== 0) {
			await User.findByIdAndUpdate(req.userId, { valid: true });
		}
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

//_________________________________________________________ADD USER INFOS_____________________________________________________________

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
			const currentDate = new Date();
			const date = new Date(req.body.birthdate);
			if (currentDate.valueOf() - date.valueOf() < 18 * 365 * 60 * 60 * 1000 * 24 || currentDate.valueOf() - date.valueOf() > 130 * 365 * 60 * 60 * 1000 * 24) {
				return res.json({ result: false, error: "Date invalide" });
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

//_________________________________________________________SETTINGS_____________________________________________________________

// Erreur 400 : indique qu'il y a eu une mauvaise demande du client et que le serveur ne peut pas la traiter
// Erreur 404 : ressource inaccessible
// Erreur 403 : ressource interdite d'accès
// Erreur 500 : erreur serveur

// Modifier son mot de passe
// Attend le token
// Attend le mot de passe actuel pour le vérifier, puis enregistre dans la BDD le nouveau mot de passe
router.put("/password", authenticateToken, body("password").isString().isLength({ min: 8, max: 32 }), body("currentPassword").isString().isLength({ min: 8, max: 32 }), async function (req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, errors: errors.array() });
		}

		// fourni par authenticateToken
		const userId = req.userId;
		const { password: newPassword, currentPassword } = req.body;

		// Récupère l'utilisateur
		const user = await User.findById(userId).select('password');
		if (!user) {
			return res.status(404).json({ result: false, error: "User not found" });
		}

		// Vérifie le mot de passe actuel
		const isCurrentValid = await bcrypt.compare(currentPassword, user.password || "");
		if (!isCurrentValid) {
			return res.status(400).json({ result: false, error: "Current password is incorrect" });
		}

		// Empêche de réutiliser le même mot de passe
		const isSameAsOld = await bcrypt.compare(newPassword, user.password || "");
		if (isSameAsOld) {
			return res.status(400).json({ result: false, error: "New password must be different from current password" });
		}

		// A modifier => Utiliser un update en base de données
		// Hash et sauvegarde
		user.password = await bcrypt.hash(newPassword, salt);
		await user.save();

		return res.json({ result: true, message: "User password successfully modified" });
	} catch (error) {
		console.log("/password :", error);
		return res.status(500).json({ result: false, error: "Server error" });
	}
});

// Modifier l'email
// Attend le token
// Enregistre dans la BDD le nouvel email
router.put("/email", authenticateToken, body("email").isEmail().normalizeEmail(), async function (req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, errors: errors.array() });
		}

		const userId = req.userId;
		const newEmail = String(req.body.email).toLowerCase();

		// Vérifie l'unicité de l'email (hors utilisateur courant)
		const emailInUse = await User.exists({ email: newEmail, _id: { $ne: userId } });
		// Le code de statut de réponse 409 Conflict indique que la requête entre en conflit avec l'état actuel du serveur.
		if (emailInUse) {
			return res.status(409).json({ result: false, error: "Email already in use" });
		}

		// Met à jour l'email et remet valid à false (à revalider par email)
		const updated = await User.findByIdAndUpdate(userId, { email: newEmail, valid: false }, { new: true });

		if (!updated) {
			return res.status(404).json({ result: false, error: "User not found" });
		}

		// TODO: envoyer un code de confirmation via email si nécessaire

		return res.json({ result: true, message: "Email successfully modified" });
	} catch (error) {
		console.log("/email :", error);
		return res.status(500).json({ result: false, error: "Server error" });
	}
});

// Désactiver le compte
// Attend le token
// Désactive le compte de l'utilisateur authentifié par son token
router.put("/desactivateAccount", authenticateToken, async function (req, res) {
	try {
		const userId = req.userId;

		const updated = await User.findByIdAndUpdate(userId, { disableAccount: true });

		if (!updated) {
			return res.status(404).json({ result: false, error: "User not found" });
		}

		return res.json({ result: true, message: "The account successfully deactivated" });
	} catch (error) {
		console.log("/desactivateAccount :", error);
		return res.status(500).json({ result: false, error: "Server error" });
	}
});

// Supprimer le compte définitivement
// Attend le token
// Supprime de la BDD le compte de l'utilisateur authentifié par son token
router.delete("/deleteAccount", authenticateToken, async function (req, res) {
	try {
		const userId = req.userId;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ result: false, error: "User not found" });
		}

		// Delete tout les conversation impliquant le user

		await User.deleteOne({ _id: userId });

		return res.json({ result: true, message: "The account successfully deleted from database" });
	} catch (error) {
		console.log("/deleteAccount :", error);
		return res.status(500).json({ result: false, error: "Server error" });
	}
});

//_________________________________________________________ADD PICTURES_______________________________________________________________

router.post("/addPhoto/:i", authenticateToken, async function (req, res, next) {
	let length = req.params.i;
	const paths = [];
	try {
		const user = await User.findById(req.userId);
		length = Math.min(length, 9 - user.photoList.length);
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
			await User.findByIdAndUpdate(req.userId, {
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
