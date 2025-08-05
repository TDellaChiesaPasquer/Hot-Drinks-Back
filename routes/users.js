var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");

const bcrypt = require("bcrypt");

/* GET users listing. */
router.get("/", function (req, res, next) {
	res.send("respond with a resource");
});

//_________________________________________________________SIGN UP_______________________________________________________________

router.post("/signup", body("email").isEmail().escape(), body("password").isString().isLength({ min: 8, max: 32 }), async function (req, res, next) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ result: false, error: errors.array() });
		}
		const data = await User.findOne({ email: req.body.email }).select("password");
		console.log(data);
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
				email: req.body.email,
				password: hash,
			});

			const savedUser = await newUser.save();
			console.log(userSaved);
			const token = generateAccessToken(userSaved._id);
			res.json({
				result: true,
				message: "New user has been saved",
				token: token,
			});
		}
	} catch (error) {
		res.json({ result: false, error: "Server error" });
	}
});

//_________________________________________________________ADD USER INFOS_______________________________________________________________
router.put("/userInfos", authenticateToken, async function (req, res, next) {
	try {
		console.log(req.body.birthdate, typeof req.body.birthdate);
		console.log(new Date(req.body.birthdate));
		const upDatedUser = await User.updateOne(
			{ _id: req.userId },
			{
				birthdate: new Date(req.body.birthdate),
				username: req.body.username,
				gender: req.body.gender,
				orientation: req.body.orientation,
				relashionship: req.body.relashionship,
			}
		);
		User.findById(req.userId).then((data) => {
			//console.log("user infos updated :", data);
			res.json({ result: true, message: "User infos updated" });
		});
	} catch (error) {
		res.json({ result: false, error: "Server error" });
	}
});

//_________________________________________________________ADD PICTURES_______________________________________________________________
router.put("/addPhoto", authenticateToken, async function (req, res, next) {
	try {
		const userFoundByIdAndUpdate = await User.findByIdAndUpdate(req.userId, {
			photoList: [req.body.photoList],
		});
		User.findById(req.userId).then((data) => {
			res.json({ result: true, message: "user pictures added succesfully!" });
		});
	} catch (error) {
		res.json({ result: false, error: "Server error" });
	}
});

module.exports = router;
