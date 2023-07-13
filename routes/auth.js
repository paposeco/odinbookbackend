import passport from "passport";
import passportJWT from "passport-jwt";
import FacebookStrategy from "passport-facebook";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const router = express.Router();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env["FACEBOOK_APP_ID"],
      clientSecret: process.env["FACEBOOK_APP_SECRET"],
      callbackURL: "http://localhost:3000/api/auth/facebook/callback",
      profileFields: [
        "id",
        "displayName",
        "picture.type(large)",
        "birthday",
        "gender",
      ],
    },
    async function(accessToken, refreshToken, profile, cb) {
      // by returning a user on the callback, user is accessible on req.user
      try {
        const userDB = await User.findOne({ facebook_id: profile.id }).exec();
        if (!userDB) {
          console.log("not user");
          const newUser = new User({
            facebook_id: profile.id,
            display_name: profile.displayName,
            profile_pic: profile.picture,
            birthday: profile.birthday,
            gender: profile.gender,
          });
          await newUser.save();
          const user = { profile: profile };
          user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);
          return cb(null, user);
        } else {
          console.log("user");
          const user = { profile: profile };
          user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);
          return cb(null, user);
        }
      } catch (err) {
        return cb(err);
      }
    },
  ),
);

// token

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env["JWTSECRET"],
    },
    function(jwtPayload, cb) {
      // check if is user

      return cb(null, true);
    },
  ),
);

export function decodeToken(req, res, next) {
  console.log(req);
  //const decoded = jwt.verify(req.body.token, process.env["JWTSECRET"]);
  // console.log(decoded);
  /* req.body.facebookid = decoded.user.facebook_id;
   * console.log(req.body); */
  next();
}

// GET login

router.get("/api/auth/facebook", passport.authenticate("facebook"));

// GET after login

router.get("/retarded", (req, res) => {
  res.json({ message: "sim" });
});

router.get(
  "/api/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: process.env["REACT_APP_URL"] + "/login",
    failureMessage: true,
    session: false,
  }),
  (req, res) => {
    // successfully logged in
    res.cookie("token", req.user.jwtoken);
    res.cookie("facebookid", req.user.profile.id);
    // I can just send the token and profile info on a cookie and not send the token on the request
    res.redirect(process.env["REACT_APP_URL"]);
  },
);

export default router;
