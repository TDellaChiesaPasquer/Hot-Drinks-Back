var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");

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

//_________________________________________________________SIGN UP_______________________________________________________________
router.post("/signup", function (req, res, next) {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email })
    .select("password")
    .then((data) => {
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

        newUser.save().then((userSaved) => {
          console.log(userSaved);
          const token = generateAccessToken(userSaved._id);
          res.json({
            result: true,
            message: "New user has been saved",
            token: token,
          });
        });
      }
    });
});

//_________________________________________________________ADD USER INFOS_______________________________________________________________
router.put("/userInfos", authenticateToken, function (req, res, next) {
    console.log(req.body.birthdate, typeof req.body.birthdate)
  console.log(new Date(req.body.birthdate));
  User.updateOne(
    { _id: req.userId },
    {
      birthdate: new Date(req.body.birthdate),
      username: req.body.username,
      gender: req.body.gender,
      orientation: req.body.orientation,
      relashionship: req.body.relashionship,
    }
  ).then(() => {
    User.findById(req.userId).then((data) => {
      //console.log("user infos updated :", data);
      res.json({ result: true, message: "User infos updated" });
    });
  });
});

//_________________________________________________________ADD PICTURES_______________________________________________________________
router.put("/addPhoto", authenticateToken, function (req, res, next) {
  User.findByIdAndUpdate(req.userId, { photoList: [req.body.photoList] }).then(
    () => {
      User.findById(req.userId).then((data) => {
        res.json({ result: true, message: "user pictures added succesfully!" });
      });
    }
  );
});

module.exports = router;
