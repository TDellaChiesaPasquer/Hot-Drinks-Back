const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//The functions for JWT identification

function generateAccessToken(userId) {
	//Generates a token for 24h, stores the username of the user
	return jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn: "24h" });
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
		next();
	});
}

module.exports = { generateAccessToken, authenticateToken };
