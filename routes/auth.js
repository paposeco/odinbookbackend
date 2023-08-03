import passport from "passport";
import passportJWT from "passport-jwt";
import FacebookStrategy from "passport-facebook";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import path from "path";
import fs from "fs";
import { mkdir } from "node:fs/promises";
import https from "https";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const router = express.Router();

// create folder for facebookprofile and save profile picture
const downloadFile = async function (url, dest, facebookid) {
  try {
    const folder = path.join(__dirname, "..", "/images", facebookid);
    const createDir = await mkdir(folder);
    const file = fs.createWriteStream("images/" + facebookid + dest);
    https.get(url, (res) => {
      res.pipe(file);
      file
        .on("finish", function () {
          file.close();
        })
        .on("error", function () {
          fs.unlink("images/" + facebookid + dest);
        });
    });
  } catch (err) {
    console.error(err.message);
  }
};

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
        "gender"
      ]
    },
    async function (accessToken, refreshToken, profile, cb) {
      // by returning a user on the callback, user is accessible on req.user
      try {
        const userDB = await User.findOne({ facebook_id: profile.id }).exec();
        if (!userDB) {
          downloadFile(profile.photos[0].value, "/profilepic.jpg", profile.id);
          // should only save the profilepiclocation, if the download was successful
          const profilePicLocation = path.join(
            __dirname,
            "..",
            "/images",
            profile.id,
            "/profilepic.jpg"
          );
          const newUser = new User({
            facebook_id: profile.id,
            display_name: profile.displayName,
            profile_pic: profilePicLocation,
            birthday: profile.birthday,
            gender: profile.gender
          });
          await newUser.save();
          const user = { profile: profile };
          /*          const user = {
            facebook_id: profile.id,
            display_name: profile.displayName
          }; */
          user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);

          return cb(null, user);
        } else {
          const user = { profile: profile };
          /* const user = {
            facebook_id: profile.id,
            display_name: profile.displayName
          }; */
          user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);

          return cb(null, user);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

// token

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env["JWTSECRET"]
    },
    function (jwtPayload, done) {
      console.log(jwtPayload);
      console.log(req._toParam);
      if (!jwtPayload.user) {
        return done(null, false);
      } else {
        console.log(jwtPayload);
        return done(null, true);
      }
    }
  )
);

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
    session: false
  }),
  (req, res) => {
    // successfully logged in
    res.cookie("token", req.user.jwtoken);
    res.cookie("facebookid", req.user.profile.id);
    // I can just send the token and profile info on a cookie and not send the token on the request
    res.redirect(process.env["REACT_APP_URL"]);
  }
);

export default router;
