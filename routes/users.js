var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { generateAccessToken, authenticateToken } = require("../modules/jwt");
const { body, validationResult } = require("express-validator");

const bcrypt = require("bcrypt");

//_________________________________________________________SIGN UP_______________________________________________________________
router.post(
  "/signup",
  body("email").isEmail().escape(),
  body("password").isString().isLength({ min: 8, max: 32 }),
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ result: false, error: errors.array() });
      }
      const data = await User.findOne({ email: req.body.email }).select(
        "password"
      );
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
  }
);


router.get('/infos', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({result: true, user});
  } catch (error) {
    console.log(error);
    res.status(500).json({result: false, error: 'Server error'});
  }
});

const genderCheck = (value) => {
  if (value === 'Homme' || value === 'Femme' || value === 'Non binaire') {
    return true;
  }
  return false;
}

const orientationCheck = (value) => {
  if (value === 'Homme' || value === 'Femme' || value === 'Tout') {
    return true;
  }
  return false;
}

const relationshipCheck = (value) => {
  if (['Chocolat chaud', 'Allongé', 'Thé', "Expresso", 'Ristretto', 'Matcha'].some(x => x === value)) {
    return true;
  }
  return false;
}

//_________________________________________________________ADD USER INFOS_______________________________________________________________
router.put("/userInfos", authenticateToken,
  body('birthdate').isISO8601(),
  body('username').isString().isLength({max: 40}).escape(),
  body('gender').custom(genderCheck),
  body('orientation').custom(orientationCheck),
  body('relationship').custom(relationshipCheck),
  async function (req, res, next) {
  try {
    await User.findByIdAndUpdate(req.userId,
      {
        birthdate: new Date(req.body.birthdate),
        username: req.body.username,
        gender: req.body.gender,
        orientation: req.body.orientation,
        relashionship: req.body.relationship,
      }
    );
    res.json({ result: true, message: "User infos updated" });
  } catch (error) {
    res.status(500).json({ result: false, error: "Server error" });
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
