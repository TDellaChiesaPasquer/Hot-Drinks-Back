var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const { generateAccessToken } = require("../modules/jwt");

const bcrypt = require("bcrypt");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// router.post(
//   "/google/signup",
//   body("token").isString().isLength({ max: 2000 }).escape(),
//   async (req, res, next) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ result: false, error: errors.array() });
//       }
//       const ticket = await client.verifyIdToken({
//         idToken: req.body.token,
//         audience: process.env.CLIENT_ID_GOOGLE,
//       });
//       const payload = ticket.getPayload();
//       if (payload.aud !== process.env.CLIENT_ID_GOOGLE) {
//         return res.json({ result: false, error: "Invalid token" });
//       }
//       if (
//         payload.iss !== "accounts.google.com" &&
//         payload.iss !== "https://accounts.google.com"
//       ) {
//         return res.json({ result: false, error: "Invalid token" });
//       }
//       if (payload.exp * 1000 - new Date().valueOf() <= 0) {
//         return res.json({ result: false, error: "Invalid token" });
//       }
//       let possibleUser = await User.findOne({
//         email: req.body.email,
//         googleAccount: true,
//       }); //Verifies if an account with the same email exists
//       if (possibleUser) {
//         return res.json({
//           result: false,
//           error: "This google account is already used",
//         });
//       }
//       const newUser = new User({
//         email: payload.email,
//         creationDate: new Date(),
//         googleAccount: true,
//       });
//       const userSaved = await newUser.save();
//       const token = generateAccessToken(userSaved._id);
//       res.json({ result: true, token });
//     } catch (error) {
//       console.log(error);
//       res.json({ result: false, error: "Server error" });
//     }
//   }
// );

router.post("/signup", function (req, res, next) {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    console.log(data);
    if (data) {
      res.json({ result: false, error: "User already exists" });
    } else {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        password: hash,
      });

      newUser.save().then((userSaved) => {
        console.log(userSaved);
        const token = generateAccessToken(userSaved._id);
        res.json({ result: true, message: "New user has been saved" });
      });
    }
  });
});

module.exports = router;
