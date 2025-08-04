var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post(
  "/google/signup",
  body("token").isString().isLength({ max: 2000 }).escape(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const ticket = await client.verifyIdToken({
        idToken: req.body.token,
        audience: process.env.CLIENT_ID_GOOGLE,
      });
      const payload = ticket.getPayload();
      if (payload.aud !== process.env.CLIENT_ID_GOOGLE) {
        return res.json({ result: false, error: "Invalid token" });
      }
      if (
        payload.iss !== "accounts.google.com" &&
        payload.iss !== "https://accounts.google.com"
      ) {
        return res.json({ result: false, error: "Invalid token" });
      }
      if (payload.exp * 1000 - new Date().valueOf() <= 0) {
        return res.json({ result: false, error: "Invalid token" });
      }
      let possibleUser = await User.findOne({
        email: req.body.email,
        googleAccount: true,
      }); //Verifies if an account with the same email exists
      if (possibleUser) {
        return res.json({
          result: false,
          error: "This google account is already used",
        });
      }
      const newUser = new User({
        email: payload.email,
        creationDate: new Date(),
        googleAccount: true,
      });
      const userSaved = await newUser.save();
      const token = generateAccessToken(userSaved._id);
      res.json({ result: true, token });
    } catch (error) {
      console.log(error);
      res.json({ result: false, error: "Server error" });
    }
  }
);

module.exports = router;
