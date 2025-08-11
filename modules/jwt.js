const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/users");

//The functions for JWT identification

async function generateAccessToken(userId, tokenNumber) {
	//Generates a token for 24h, stores the username of the user
	await User.findByIdAndUpdate(userId, { tokenNumber });
	return jwt.sign({ userId, tokenNumber }, process.env.SECRET_KEY, {
		expiresIn: "1000000h",
	});
}

function authenticateToken(req, res, next) {
	//Identify the token, and puts the username in the request
	const token = req.headers["authorization"];
	if (token == null) {
		return res.json({ result: false, error: "Please login." }); //No custom status to not have an error in the client console
	}
	jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
		if (err) {
			return res.json({
				result: false,
				error: "Your session is invalid. Please login again.",
			});
		}
		req.userId = new mongoose.Types.ObjectId(decoded.userId);
		User.findById(req.userId).then((data) => {
			if (!data || !decoded.tokenNumber || data.tokenNumber !== decoded.tokenNumber) {
				return res.json({
					result: false,
					error: "Your session is invalid. Please login again.",
				});
			}
			next();
		});
	});
}

module.exports = { generateAccessToken, authenticateToken };
